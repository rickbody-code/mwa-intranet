import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { toInputJson } from '@/lib/prisma-json';

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

    // Get user from database to get user.id
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get the page (by ID or slug)
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id }
        ]
      },
      include: {
        currentVersion: true,
        permissions: {
          where: {
            OR: [
              { userId: dbUser.id },
              { role: dbUser.role }
            ]
          }
        }
      }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get the target version
    const targetVersion = await prisma.pageVersion.findFirst({
      where: { id: versionId, pageId: page.id }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (!targetVersion) {
      return NextResponse.json({ 
        error: "Target version not found" 
      }, { status: 404 });
    }

    // Check edit access
    const canEdit = dbUser.role === 'ADMIN' || 
      page.createdById === dbUser.id ||
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
          pageId: page.id,
          title: targetVersion.title,
          contentJSON: toInputJson(targetVersion.contentJSON),
          contentMarkdown: targetVersion.contentMarkdown,
          changeNote: changeNote || `Reverted to version from ${targetVersion.createdAt.toISOString()}`,
          createdById: dbUser.id,
        }
      });

      // Update page to use the new version
      const updatedPage = await tx.page.update({
        where: { id: page.id },
        data: {
          title: targetVersion.title,
          currentVersionId: newVersion.id,
          updatedById: dbUser.id,
          summary: targetVersion.contentMarkdown?.substring(0, 200)
        },
        include: {
          currentVersion: true,
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } }
        }
      });

      // Log the revert activity (if ActivityLog is available)
      await tx.activityLog.create({
        data: {
          pageId: page.id,
          versionId: newVersion.id,
          actorId: dbUser.id,
          type: "RESTORE",
          data: {
            fromVersionId: page.currentVersionId,
            toVersionId: versionId,
            description: `Reverted page to version from ${targetVersion.createdAt.toISOString()}`
          } as Prisma.InputJsonValue
        }
      });

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