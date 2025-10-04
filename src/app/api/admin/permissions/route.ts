import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin();

    const { action, pageId, userId, canRead, canWrite, canAdmin, permissionId } = await request.json();

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    switch (action) {
      case 'create':
        if (!pageId || !userId) {
          return NextResponse.json({ error: "Page ID and User ID are required" }, { status: 400 });
        }

        // Check if permission already exists
        const existingPermission = await prisma.pagePermission.findFirst({
          where: {
            pageId,
            userId
          }
        });

        if (existingPermission) {
          return NextResponse.json({ error: "Permission already exists for this user and page" }, { status: 400 });
        }

        const newPermission = await prisma.pagePermission.create({
          data: {
            pageId,
            userId,
            canRead: canRead || false,
            canWrite: canWrite || false,
            canAdmin: canAdmin || false
          },
          include: {
            page: { select: { title: true } },
            user: { select: { name: true, email: true } }
          }
        });

        await prisma.activityLog.create({
          data: {
            pageId,
            actorId: adminUser.id,
            type: 'PERMISSION_CHANGE',
            data: { 
              adminAction: true,
              action: 'permission.created',
              targetUserId: userId,
              permissions: { canRead, canWrite, canAdmin }
            } as Prisma.InputJsonValue
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Permission created successfully",
          permission: newPermission
        });

      case 'update':
        if (!permissionId) {
          return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
        }

        const updatedPermission = await prisma.pagePermission.update({
          where: { id: permissionId },
          data: {
            canRead: canRead || false,
            canWrite: canWrite || false,
            canAdmin: canAdmin || false
          },
          include: {
            page: { select: { title: true } },
            user: { select: { name: true, email: true } }
          }
        });

        await prisma.activityLog.create({
          data: {
            actorId: adminUser.id,
            type: 'PERMISSION_CHANGE',
            data: { 
              adminAction: true,
              action: 'permission.updated',
              permissionId,
              permissions: { canRead, canWrite, canAdmin }
            } as Prisma.InputJsonValue
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Permission updated successfully",
          permission: updatedPermission
        });

      case 'delete':
        if (!permissionId) {
          return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
        }

        const permissionToDelete = await prisma.pagePermission.findUnique({
          where: { id: permissionId },
          include: {
            page: { select: { title: true } },
            user: { select: { name: true, email: true } }
          }
        });

        if (!permissionToDelete) {
          return NextResponse.json({ error: "Permission not found" }, { status: 404 });
        }

        await prisma.pagePermission.delete({
          where: { id: permissionId }
        });

        await prisma.activityLog.create({
          data: {
            pageId: permissionToDelete.pageId,
            actorId: adminUser.id,
            type: 'PERMISSION_CHANGE',
            data: { 
              adminAction: true, 
              action: 'permission.deleted',
              destructive: true,
              pageTitle: permissionToDelete.page?.title,
              userName: permissionToDelete.user?.name
            } as Prisma.InputJsonValue
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: "Permission deleted successfully"
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin permission action error:', error);
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
    const pageId = searchParams.get('pageId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    
    if (pageId) {
      where.pageId = pageId;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const [permissions, total, permissionStats] = await Promise.all([
      prisma.pagePermission.findMany({
        where,
        include: {
          page: { select: { id: true, title: true, slug: true, status: true } },
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.pagePermission.count({ where }),
      prisma.pagePermission.groupBy({
        by: ['canRead', 'canWrite', 'canAdmin'],
        _count: { id: true }
      })
    ]);

    return NextResponse.json({
      permissions,
      permissionStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin permissions fetch error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}