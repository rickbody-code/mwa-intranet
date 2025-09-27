import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const actorId = searchParams.get('actorId');
    const type = searchParams.get('type');
    
    // Validate and sanitize pagination parameters
    const limitParam = searchParams.get('limit') || '50';
    const offsetParam = searchParams.get('offset') || '0';
    
    const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 100);
    const offset = Math.max(parseInt(offsetParam) || 0, 0);

    // Check authorization - admin can see all, others need specific pageId
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAdmin && !pageId) {
      return NextResponse.json(
        { error: "Access denied. Page-specific access required." },
        { status: 403 }
      );
    }

    // Build where clause for filtering with permission checks
    const where: any = {};
    
    if (pageId) {
      where.pageId = pageId;
      
      // Non-admin users can only see activity for pages they can read
      if (!isAdmin) {
        // Check if user has read permission to this page
        const pageAccess = await prisma.page.findFirst({
          where: {
            id: pageId,
            OR: [
              { status: 'PUBLISHED' }, // Published pages are readable by all authenticated users
              { createdById: user.id }, // User created the page
              { 
                permissions: {
                  some: {
                    AND: [
                      { userId: user.id },
                      { canRead: true }
                    ]
                  }
                }
              }
            ]
          }
        });

        if (!pageAccess) {
          return NextResponse.json(
            { error: "Access denied to this page's activity logs" },
            { status: 403 }
          );
        }
      }
    }
    
    if (actorId && isAdmin) {
      where.actorId = actorId;
    }
    
    if (type && ['CREATE', 'UPDATE', 'RESTORE', 'UPLOAD', 'DELETE', 'PUBLISH', 'ARCHIVE', 'TAG_ADD', 'TAG_REMOVE', 'PERMISSION_CHANGE'].includes(type)) {
      where.type = type as ActivityType;
    }

    // Fetch activity logs with related data
    const [activities, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true }
          },
          page: {
            select: { id: true, title: true, slug: true, path: true }
          },
          version: {
            select: { id: true, title: true, changeNote: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.activityLog.count({ where })
    ]);

    // Transform for response
    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      data: activity.data,
      createdAt: activity.createdAt.toISOString(),
      actor: activity.actor,
      page: activity.page ? {
        id: activity.page.id,
        title: activity.page.title,
        slug: activity.page.slug,
        path: activity.page.path,
        safeHref: activity.page.path && activity.page.path.startsWith('/') 
          ? `/wiki${activity.page.path}` 
          : `/wiki/pages/${activity.page.id}`
      } : null,
      version: activity.version ? {
        id: activity.version.id,
        title: activity.version.title,
        changeNote: activity.version.changeNote
      } : null
    }));

    return NextResponse.json({
      activities: transformedActivities,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}