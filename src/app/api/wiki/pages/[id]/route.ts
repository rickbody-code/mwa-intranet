import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageVersion, Prisma } from "@prisma/client";
import { z } from "zod";

const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.object({}).passthrough().optional(), // TipTap JSON content
  contentMarkdown: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  changeNote: z.string().optional(),
  isMinorEdit: z.boolean().default(false),
});

// GET /api/wiki/pages/[id] - Get specific page with version history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("includeHistory") === "true";
    const versionId = searchParams.get("versionId");

    // Get page with current version or specific version
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        currentVersion: true,
        tags: { include: { tag: true } },
        parent: { select: { id: true, title: true, slug: true } },
        children: { 
          select: { id: true, title: true, slug: true, status: true },
          where: user.role === "ADMIN" ? {} : {
            OR: [
              { status: "PUBLISHED" },
              { createdById: user.id },
              {
                permissions: {
                  some: {
                    OR: [
                      { userId: user.id, canRead: true },
                      { role: user.role, canRead: true }
                    ]
                  }
                }
              }
            ]
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            contentType: true,
            size: true,
            createdAt: true,
            uploadedBy: { select: { name: true } }
          }
        },
        permissions: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        _count: {
          select: { views: true, versions: true, outgoingLinks: true, incomingLinks: true }
        }
      }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if user can read this page
    const canRead = await canUserAccessPage(user.id, user.role, page, "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get specific version if requested
    let version = page.currentVersion;
    if (versionId) {
      version = await prisma.pageVersion.findFirst({
        where: { id: versionId, pageId: params.id },
        include: {
          createdBy: { select: { name: true, email: true } }
        }
      });
      
      if (!version) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
    }

    let versions: any[] = [];
    if (includeHistory) {
      versions = await prisma.pageVersion.findMany({
        where: { pageId: params.id },
        include: {
          createdBy: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // Record page view (anonymous tracking)
    await prisma.pageView.create({
      data: {
        pageId: params.id,
        userId: user.id,
      }
    });

    // Increment view count
    await prisma.page.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({
      ...page,
      currentVersion: version,
      versions: includeHistory ? versions : undefined
    });

  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/wiki/pages/[id] - Update page and create new version
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: { permissions: true }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if user can write to this page
    const canWrite = await canUserAccessPage(user.id, user.role, page, "WRITE");
    if (!canWrite) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updatePageSchema.parse(body);

    // Create new version and update page in transaction
    const result = await prisma.$transaction(async (tx) => {
      let newVersion = null;
      
      // Create new version if content changed
      if (validatedData.content || validatedData.contentMarkdown) {
        newVersion = await tx.pageVersion.create({
          data: {
            pageId: params.id,
            title: validatedData.title || page.title,
            contentJSON: (validatedData.content || {}) as Prisma.InputJsonValue,
            contentMarkdown: validatedData.contentMarkdown || "",
            changeNote: validatedData.changeNote || "Updated content",
            isMinorEdit: validatedData.isMinorEdit,
            createdById: user.id,
          }
        });
      }

      // Update page
      const updateData: any = {
        updatedById: user.id,
      };

      if (validatedData.title) {
        updateData.title = validatedData.title;
      }

      if (validatedData.status) {
        updateData.status = validatedData.status;
      }

      if (validatedData.contentMarkdown) {
        updateData.summary = validatedData.contentMarkdown.substring(0, 200);
      }

      if (newVersion) {
        updateData.currentVersionId = newVersion.id;
      }

      const updatedPage = await tx.page.update({
        where: { id: params.id },
        data: updateData,
        include: {
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
          currentVersion: true,
          tags: { include: { tag: true } }
        }
      });

      // Handle tags if provided
      if (validatedData.tags !== undefined) {
        // Remove existing tags
        await tx.pageTag.deleteMany({
          where: { pageId: params.id }
        });

        // Add new tags
        for (const tagName of validatedData.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });

          await tx.pageTag.create({
            data: {
              pageId: params.id,
              tagId: tag.id
            }
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          pageId: params.id,
          versionId: newVersion?.id,
          actorId: user.id,
          type: "UPDATE",
          data: { 
            changes: Object.keys(validatedData),
            isMinorEdit: validatedData.isMinorEdit 
          } as Prisma.InputJsonValue
        }
      });

      // Fetch and return page with updated tags
      return await tx.page.findUnique({
        where: { id: params.id },
        include: {
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
          currentVersion: true,
          tags: { include: { tag: true } }
        }
      });
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating page:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/wiki/pages/[id] - Delete or archive page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: { 
        permissions: true,
        children: { select: { id: true } }
      }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if user can admin this page (delete requires admin permission)
    const canDelete = await canUserAccessPage(user.id, user.role, page, "ADMIN");
    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if page has children - prevent deletion of parent pages
    if (page.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete page with child pages" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (force && user.role === "ADMIN") {
      // Permanently delete page with proper cleanup
      await prisma.$transaction(async (tx) => {
        // Log activity first (before deletion)
        await tx.activityLog.create({
          data: {
            pageId: params.id,
            actorId: user.id,
            type: "DELETE",
            data: { pageId: params.id, title: page.title, permanent: true } as Prisma.InputJsonValue
          }
        });

        // Delete page (cascading deletes handle most dependencies via schema)
        await tx.page.delete({
          where: { id: params.id }
        });
      });

      return NextResponse.json({ message: "Page permanently deleted" });
    } else {
      // Archive page (soft delete)
      const archivedPage = await prisma.page.update({
        where: { id: params.id },
        data: {
          status: "ARCHIVED",
          updatedById: user.id
        }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          pageId: params.id,
          actorId: user.id,
          type: "ARCHIVE",
          data: { title: page.title } as Prisma.InputJsonValue
        }
      });

      return NextResponse.json({ message: "Page archived", page: archivedPage });
    }

  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check page access permissions
async function canUserAccessPage(
  userId: string,
  userRole: string,
  page: any,
  permission: "READ" | "WRITE" | "ADMIN"
): Promise<boolean> {
  // Admins can do everything
  if (userRole === "ADMIN") {
    return true;
  }

  // Check page-specific permissions FIRST (before status filtering)
  const pagePermission = page.permissions?.find((p: any) => 
    (p.userId === userId) || (p.role === userRole)
  );

  if (pagePermission) {
    switch (permission) {
      case "READ":
        return pagePermission.canRead;
      case "WRITE":
        return pagePermission.canWrite;
      case "ADMIN":
        return pagePermission.canAdmin;
    }
  }

  // Creator permissions (can access their own content regardless of status)
  if (page.createdById === userId) {
    return true; // Creators can read/write/admin their own pages
  }

  // Default permissions for published pages
  if (page.status === "PUBLISHED") {
    switch (permission) {
      case "READ":
        return true; // All authenticated users can read published pages
      case "WRITE":
        return false; // Need explicit permission or creator/admin
      case "ADMIN":
        return false; // Need explicit permission or creator/admin
    }
  }

  // Non-published pages require explicit permission or creator/admin access
  return false;
}