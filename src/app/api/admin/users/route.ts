import { NextRequest, NextResponse } from "next/server";
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

    const { action, userId, role, email, name } = await request.json();

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    switch (action) {
      case 'updateRole':
        if (!userId || !role || !['ADMIN', 'STAFF'].includes(role)) {
          return NextResponse.json({ error: "Invalid user ID or role" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { role: role as any }
        });

        await prisma.activityLog.create({
          data: {
            actorId: adminUser.id,
            type: 'USER_ROLE_CHANGE',
            data: { 
              adminAction: true, 
              action: 'user.role_updated',
              newRole: role,
              targetUser: updatedUser.email
            } as Prisma.InputJsonValue
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: `User role updated to ${role}`,
          user: updatedUser
        });

      case 'createUser':
        if (!email || !name) {
          return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            role: role || 'STAFF'
          }
        });

        await prisma.activityLog.create({
          data: {
            actorId: adminUser.id,
            type: 'CREATE',
            data: { 
              adminAction: true, 
              action: 'user.created',
              newUserEmail: email,
              assignedRole: role || 'STAFF'
            } as Prisma.InputJsonValue
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: `User ${email} created successfully`,
          user: newUser
        });

      case 'deleteUser':
        if (!userId) {
          return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        // Don't allow deleting yourself
        if (userId === adminUser.id) {
          return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        const userToDelete = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!userToDelete) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Use transaction for atomic user deletion
        await prisma.$transaction(async (tx) => {
          // Log activity BEFORE deletion
          await tx.activityLog.create({
            data: {
              actorId: adminUser.id,
              type: 'DELETE',
              data: { 
                adminAction: true, 
                action: 'user.deleted',
                destructive: true,
                deletedUserEmail: userToDelete.email
              } as Prisma.InputJsonValue
            }
          });

          // Handle user's content and relationships
          await tx.page.updateMany({
            where: { createdById: userId },
            data: { createdById: adminUser.id }
          });
          
          await tx.page.updateMany({
            where: { updatedById: userId },
            data: { updatedById: adminUser.id }
          });
          
          await tx.pageVersion.updateMany({
            where: { createdById: userId },
            data: { createdById: adminUser.id }
          });
          
          await tx.attachment.updateMany({
            where: { uploadedById: userId },
            data: { uploadedById: adminUser.id }
          });
          
          // Remove user-specific permissions (will cascade due to FK)
          await tx.pagePermission.deleteMany({
            where: { userId: userId }
          });
          
          // Update settings updater references
          await tx.wikiSetting.updateMany({
            where: { updatedBy: userId },
            data: { updatedBy: adminUser.id }
          });

          // Finally delete the user
          await tx.user.delete({
            where: { id: userId }
          });
        });

        return NextResponse.json({ 
          success: true, 
          message: `User ${userToDelete.email} deleted successfully`
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin user action error:', error);
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
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }

    const [users, total, roleStats] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              createdPages: true,
              updatedPages: true,
              activityLogs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    const roleStatsMap = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      users,
      roleStats: roleStatsMap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}