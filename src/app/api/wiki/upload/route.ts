import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Initialize Google Cloud Storage with Replit authentication
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

// POST /api/wiki/upload - Upload files for wiki pages
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pageId = formData.get('pageId') as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const objectId = randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${safeName}`;
      
      // Use environment variable for bucket or default
      const bucketName = process.env.PRIVATE_OBJECT_BUCKET || "wiki-attachments";
      const objectName = `attachments/${objectId}_${filename}`;
      const blobKey = objectName;

      // Get bucket and file references
      const bucket = storage.bucket(bucketName);
      const file_ref = bucket.file(objectName);

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Google Cloud Storage
      await file_ref.save(buffer, {
        metadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=3600',
        },
      });

      // Generate signed URL for download (valid for 1 hour)
      const [downloadUrl] = await file_ref.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      // Create attachment record if pageId is provided
      let attachment = null;
      if (pageId) {
        // Verify user has write access to the page
        const page = await prisma.page.findUnique({
          where: { id: pageId },
          include: { permissions: true }
        });

        if (!page) {
          return NextResponse.json({ error: "Page not found" }, { status: 404 });
        }

        // Check permissions
        const canWrite = user.role === "ADMIN" || 
                        page.createdById === user.id ||
                        page.permissions.some(p => 
                          (p.userId === user.id && p.canWrite) ||
                          (p.role === user.role && p.canWrite)
                        );

        if (!canWrite) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Create attachment record
        attachment = await prisma.attachment.create({
          data: {
            pageId: pageId,
            filename: filename,
            originalName: file.name,
            blobKey: blobKey,
            contentType: file.type,
            size: file.size,
            uploadedById: user.id,
          }
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            pageId: pageId,
            actorId: user.id,
            type: "UPLOAD",
            data: { 
              filename: file.name,
              contentType: file.type,
              size: file.size 
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        filename: filename,
        originalName: file.name,
        url: downloadUrl,
        contentType: file.type,
        size: file.size,
        blobKey: blobKey,
        attachmentId: attachment?.id
      });

    } catch (storageError) {
      console.error("Storage upload failed:", storageError);
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}