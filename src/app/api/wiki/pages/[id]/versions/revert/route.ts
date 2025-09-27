import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/wiki/pages/[id]/versions/revert
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const { versionId, changeNote } = body;

    if (!versionId) {
      return NextResponse.json({ 
        error: "Version ID is required" 
      }, { status: 400 });
    }

    // Get the page and target version
    const [page, targetVersion] = await Promise.all([
      prisma.page.findUnique({
        where: { id: params.id },
        include: {
          currentVersion: true,
          permissions: {
            where: {
              OR: [
                { userId: user.id },
                { role: user.role }
              ]
            }
          }
        }
      }),
      prisma.pageVersion.findFirst({
        where: { id: versionId, pageId: params.id }
      })
    ]);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (!targetVersion) {
      return NextResponse.json({ 
        error: "Target version not found" 
      }, { status: 404 });
    }

    // Check edit access
    const canEdit = user.role === 'ADMIN' || 
      page.createdById === user.id ||
      page.permissions.some(p => p.canWrite);

    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already the current version
    if (page.currentVersionId === versionId) {
      return NextResponse.json({ 
        error: "This is already the current version" 
      }, { status: 400 });
    }

    // Create transaction to revert
    const result = await prisma.$transaction(async (tx) => {
      // Create a new version with the target version's content
      const newVersion = await tx.pageVersion.create({
        data: {
          pageId: params.id,
          title: targetVersion.title,
          contentJSON: targetVersion.contentJSON,
          contentMarkdown: targetVersion.contentMarkdown,
          changeNote: changeNote || `Reverted to version from ${targetVersion.createdAt.toISOString()}`,
          createdById: user.id,
        }
      });

      // Update page to use the new version
      const updatedPage = await tx.page.update({
        where: { id: params.id },
        data: {
          title: targetVersion.title,
          currentVersionId: newVersion.id,
          updatedById: user.id,
          summary: targetVersion.contentMarkdown?.substring(0, 200)
        },
        include: {
          currentVersion: true,
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } }
        }
      });

      // Log the revert activity (if ActivityLog is available)
      try {
        await tx.activityLog.create({
          data: {
            type: 'REVERT',
            description: `Reverted page to version from ${targetVersion.createdAt.toISOString()}`,
            entityType: 'PAGE',
            entityId: params.id,
            userId: user.id,
            metadata: {
              fromVersionId: page.currentVersionId,
              toVersionId: versionId,
              newVersionId: newVersion.id
            }
          }
        });
      } catch (error) {
        // ActivityLog not implemented yet, continue without logging
        console.log('ActivityLog not available, skipping activity logging');
      }

      return { page: updatedPage, newVersion };
    });

    return NextResponse.json({
      message: "Page successfully reverted",
      page: result.page,
      newVersion: result.newVersion,
      revertedToVersion: {
        id: targetVersion.id,
        createdAt: targetVersion.createdAt,
        changeNote: targetVersion.changeNote
      }
    });

  } catch (error) {
    console.error('Error reverting page version:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}