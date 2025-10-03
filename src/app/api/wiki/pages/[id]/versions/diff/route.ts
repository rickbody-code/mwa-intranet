import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple text diff implementation
function generateDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const diff = [];
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex] || '';
    const newLine = newLines[newIndex] || '';
    
    if (oldLine === newLine) {
      diff.push({
        type: 'unchanged',
        content: oldLine,
        oldLineNum: oldIndex + 1,
        newLineNum: newIndex + 1
      });
      oldIndex++;
      newIndex++;
    } else if (oldIndex >= oldLines.length) {
      diff.push({
        type: 'added',
        content: newLine,
        newLineNum: newIndex + 1
      });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      diff.push({
        type: 'removed',
        content: oldLine,
        oldLineNum: oldIndex + 1
      });
      oldIndex++;
    } else {
      // Simple replacement detection
      diff.push({
        type: 'removed',
        content: oldLine,
        oldLineNum: oldIndex + 1
      });
      diff.push({
        type: 'added',
        content: newLine,
        newLineNum: newIndex + 1
      });
      oldIndex++;
      newIndex++;
    }
  }
  
  return diff;
}

// GET /api/wiki/pages/[id]/versions/diff?from=versionId&to=versionId
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const fromVersionId = searchParams.get('from');
    const toVersionId = searchParams.get('to');

    if (!fromVersionId || !toVersionId) {
      return NextResponse.json({ 
        error: "Both 'from' and 'to' version IDs are required" 
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

    // Get page to verify access (support both ID and slug)
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id }
        ]
      },
      include: {
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

    // Check read access
    const hasAccess = dbUser.role === 'ADMIN' || 
      page.status === 'PUBLISHED' || 
      page.createdById === dbUser.id ||
      page.permissions.some(p => p.canRead);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get both versions
    const [fromVersion, toVersion] = await Promise.all([
      prisma.pageVersion.findFirst({
        where: { id: fromVersionId, pageId: page.id },
        include: {
          createdBy: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.pageVersion.findFirst({
        where: { id: toVersionId, pageId: page.id },
        include: {
          createdBy: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    if (!fromVersion || !toVersion) {
      return NextResponse.json({ 
        error: "One or both versions not found" 
      }, { status: 404 });
    }

    // Generate diff
    const diff = generateDiff(
      fromVersion.contentMarkdown,
      toVersion.contentMarkdown
    );

    // Calculate statistics
    const stats = {
      linesAdded: diff.filter(d => d.type === 'added').length,
      linesRemoved: diff.filter(d => d.type === 'removed').length,
      linesUnchanged: diff.filter(d => d.type === 'unchanged').length,
      totalChanges: diff.filter(d => d.type !== 'unchanged').length
    };

    return NextResponse.json({
      fromVersion: {
        id: fromVersion.id,
        title: fromVersion.title,
        changeNote: fromVersion.changeNote,
        createdAt: fromVersion.createdAt,
        createdBy: fromVersion.createdBy
      },
      toVersion: {
        id: toVersion.id,
        title: toVersion.title,
        changeNote: toVersion.changeNote,
        createdAt: toVersion.createdAt,
        createdBy: toVersion.createdBy
      },
      diff,
      stats
    });

  } catch (error) {
    console.error('Error generating version diff:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}