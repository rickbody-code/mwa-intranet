import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cleanupAttachmentBlobs } from "@/lib/storage-cleanup";
import "@/lib/app-startup"; // Trigger startup validation

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin();

    const { action, pageIds, status } = await request.json();

    if (!action || !Array.isArray(pageIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let result;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case 'archive':
        result = await prisma.$transaction(async (tx) => {
          const updateResult = await tx.page.updateMany({
            where: { id: { in: pageIds } },
            data: { 
              status: 'ARCHIVED',
              updatedById: user.id
            }
          });
          
          // Log activity for each page
          for (const pageId of pageIds) {
            await tx.activityLog.create({
              data: {
                pageId: pageId,
                actorId: user.id,
                type: 'ARCHIVE',
                data: { adminAction: true } as Prisma.InputJsonValue
              }
            });
          }
          
          return updateResult;
        });
        break;

      case 'delete':
        // Use transaction for atomic deletion with proper logging
        result = await prisma.$transaction(async (tx) => {
          // Log activity BEFORE deletion
          for (const pageId of pageIds) {
            await tx.activityLog.create({
              data: {
                pageId: pageId,
                actorId: user.id,
                type: 'DELETE',
                data: { adminAction: true, destructive: true } as Prisma.InputJsonValue
              }
            });
          }
          
          // Get attachments for cleanup before deletion
          const attachments = await tx.attachment.findMany({
            where: { pageId: { in: pageIds } },
            select: { blobKey: true }
          });
          
          // Delete all related records in proper order
          await tx.pageTag.deleteMany({
            where: { pageId: { in: pageIds } }
          });
          await tx.pageView.deleteMany({
            where: { pageId: { in: pageIds } }
          });
          await tx.pageLink.deleteMany({
            where: { OR: [
              { fromPageId: { in: pageIds } },
              { toPageId: { in: pageIds } }
            ]}
          });
          await tx.attachment.deleteMany({
            where: { pageId: { in: pageIds } }
          });
          await tx.pagePermission.deleteMany({
            where: { pageId: { in: pageIds } }
          });
          await tx.pageVersion.deleteMany({
            where: { pageId: { in: pageIds } }
          });
          await tx.page.deleteMany({
            where: { id: { in: pageIds } }
          });
          
          return { count: pageIds.length, attachments: attachments.map(a => a.blobKey) };
        });
        
        // Cleanup object storage after successful transaction
        if (result.attachments && result.attachments.length > 0) {
          const cleanupResults = await cleanupAttachmentBlobs(result.attachments);
          console.log(`Storage cleanup: ${cleanupResults.success} succeeded, ${cleanupResults.failed} failed`);
          
          // Log cleanup results in activity log
          await prisma.activityLog.create({
            data: {
              actorId: user.id,
              type: 'DELETE',
              data: { 
                adminAction: true,
                action: 'storage.cleanup',
                blobsDeleted: cleanupResults.success,
                blobsFailed: cleanupResults.failed,
                failedBlobs: cleanupResults.results.filter(r => !r.success).map(r => r.blobKey)
              } as Prisma.InputJsonValue
            }
          });
        }
        break;

      case 'publish':
        result = await prisma.$transaction(async (tx) => {
          const updateResult = await tx.page.updateMany({
            where: { id: { in: pageIds } },
            data: { 
              status: 'PUBLISHED',
              updatedById: user.id
            }
          });
          
          // Log activity for each page
          for (const pageId of pageIds) {
            await tx.activityLog.create({
              data: {
                pageId: pageId,
                actorId: user.id,
                type: 'PUBLISH',
                data: { adminAction: true } as Prisma.InputJsonValue
              }
            });
          }
          
          return updateResult;
        });
        break;

      case 'changeStatus':
        if (!status || !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        
        result = await prisma.page.updateMany({
          where: { id: { in: pageIds } },
          data: { 
            status: status as any,
            updatedById: user.id
          }
        });
        
        // Log activity for each page
        for (const pageId of pageIds) {
          await prisma.activityLog.create({
            data: {
              pageId: pageId,
              actorId: user.id,
              type: status === 'PUBLISHED' ? 'PUBLISH' : 'UPDATE',
              data: { adminAction: true, newStatus: status } as Prisma.InputJsonValue
            }
          });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully ${action}d ${pageIds.length} page(s)`,
      result 
    });

  } catch (error) {
    console.error('Admin content action error:', error);
    
    // Handle authorization errors properly
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { 
          versions: { 
            some: { 
              contentMarkdown: { contains: search, mode: 'insensitive' } 
            } 
          } 
        }
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        include: {
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
          _count: { select: { tags: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.page.count({ where })
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin content search error:', error);
    
    // Handle authorization errors properly
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}