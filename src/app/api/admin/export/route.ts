import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pages';

    const session = await getServerSession(authOptions);
    const adminUser = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    let exportData: any = {};
    let filename = '';

    switch (type) {
      case 'pages':
        const pages = await prisma.page.findMany({
          include: {
            createdBy: { select: { name: true, email: true } },
            updatedBy: { select: { name: true, email: true } },
            tags: {
              include: {
                tag: { select: { name: true, color: true } }
              }
            },
            versions: {
              select: {
                id: true,
                title: true,
                contentMarkdown: true,
                changeNote: true,
                createdAt: true,
                createdBy: { select: { name: true, email: true } }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        exportData = {
          type: 'wiki_pages_export',
          exportedAt: new Date().toISOString(),
          exportedBy: adminUser.email,
          totalPages: pages.length,
          pages: pages.map(page => ({
            id: page.id,
            title: page.title,
            slug: page.slug,
            status: page.status,
            contentMarkdown: page.versions[0]?.contentMarkdown || '',  // Get from latest version
            tags: page.tags.map(pt => pt.tag.name),
            author: page.createdBy,
            lastUpdatedBy: page.updatedBy,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt,
            viewCount: page.viewCount,
            versions: page.versions
          }))
        };
        filename = `wiki-pages-export-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'users':
        const users = await prisma.user.findMany({
          include: {
            _count: {
              select: {
                createdPages: true,
                updatedPages: true,
                activityLogs: true
              }
            }
          }
        });

        exportData = {
          type: 'wiki_users_export',
          exportedAt: new Date().toISOString(),
          exportedBy: adminUser.email,
          totalUsers: users.length,
          users: users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            stats: user._count
          }))
        };
        filename = `wiki-users-export-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'activity':
        const activities = await prisma.activityLog.findMany({
          include: {
            actor: { select: { name: true, email: true } },
            page: { select: { title: true, slug: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Limit to last 1000 activities
        });

        exportData = {
          type: 'wiki_activity_export',
          exportedAt: new Date().toISOString(),
          exportedBy: adminUser.email,
          totalActivities: activities.length,
          activities: activities.map(activity => ({
            id: activity.id,
            type: activity.type,
            actor: activity.actor,
            page: activity.page,
            data: activity.data,
            createdAt: activity.createdAt
          }))
        };
        filename = `wiki-activity-export-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'full':
        // Full wiki export
        const [allPages, allUsers, allSettings, allActivity] = await Promise.all([
          prisma.page.findMany({
            include: {
              createdBy: { select: { name: true, email: true } },
              updatedBy: { select: { name: true, email: true } },
              tags: { include: { tag: true } },
              versions: true
            }
          }),
          prisma.user.findMany({
            include: {
              _count: {
                select: {
                  createdPages: true,
                  updatedPages: true,
                  activityLogs: true
                }
              }
            }
          }),
          prisma.wikiSetting.findMany(),
          prisma.activityLog.findMany({
            include: {
              actor: { select: { name: true, email: true } },
              page: { select: { title: true, slug: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 500
          })
        ]);

        exportData = {
          type: 'wiki_full_export',
          exportedAt: new Date().toISOString(),
          exportedBy: adminUser.email,
          version: '1.0.0',
          data: {
            pages: allPages,
            users: allUsers,
            settings: allSettings,
            recentActivity: allActivity
          }
        };
        filename = `wiki-full-export-${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Log the export activity
    await prisma.activityLog.create({
      data: {
        actorId: adminUser.id,
        type: 'UPDATE', // Using UPDATE as export is a read operation
        data: { 
          adminAction: true,
          action: 'wiki.export',
          exportType: type,
          recordCount: exportData.totalPages || exportData.totalUsers || exportData.totalActivities || 0
        }
      }
    });

    const jsonString = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}