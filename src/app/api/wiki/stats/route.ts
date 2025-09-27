import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Wiki stats endpoint for homepage widget
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Base query conditions for pages the user can access
    const baseWhere = user.role === "ADMIN" ? {} : {
      OR: [
        { status: "PUBLISHED" as const },
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
    };

    // Get overview stats
    const [totalPages, totalViews] = await Promise.all([
      prisma.page.count({ where: baseWhere }),
      prisma.page.aggregate({
        where: baseWhere,
        _sum: { viewCount: true }
      })
    ]);

    // Get popular pages (most viewed)
    const popularPages = await prisma.page.findMany({
      where: {
        ...baseWhere,
        viewCount: { gt: 0 }
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        tags: {
          select: { tagId: true }
        }
      },
      orderBy: { viewCount: "desc" },
      take: 10
    });

    // Get recent pages (recently updated)
    const recentPages = await prisma.page.findMany({
      where: baseWhere,
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        tags: {
          select: { tagId: true }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    });

    // Transform data for client with safe navigation paths
    const transformPage = (page: any) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      path: page.path,
      safeHref: page.path && page.path.startsWith('/') ? `/wiki${page.path}` : `/wiki/pages/${page.id}`,
      summary: page.summary,
      status: page.status,
      viewCount: page.viewCount,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      authorName: page.createdBy?.name,
      tagsCount: page.tags?.length || 0
    });

    // Build recent activity feed (simplified for now)
    const recentActivity = [
      ...recentPages.slice(0, 5).map(page => ({
        type: 'updated' as const,
        page: transformPage(page),
        timestamp: page.updatedAt.toISOString()
      }))
    ];

    const stats = {
      totalPages: totalPages,
      totalViews: totalViews._sum?.viewCount || 0,
      popularPages: popularPages.map(transformPage),
      recentPages: recentPages.map(transformPage),
      recentActivity: recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10)
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Wiki stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wiki stats" }, 
      { status: 500 }
    );
  }
}