import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/wiki/pages/[id]/versions/[versionId] - Delete a specific version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get page to verify access
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: params.id },
          { slug: params.id }
        ]
      },
      select: {
        id: true,
        createdById: true,
        currentVersionId: true
      }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if user has permission to delete versions (admin or page creator)
    const canDelete = dbUser.role === 'ADMIN' || page.createdById === dbUser.id;
    if (!canDelete) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if version exists and belongs to this page
    const version = await prisma.pageVersion.findUnique({
      where: { id: params.versionId }
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (version.pageId !== page.id) {
      return NextResponse.json({ error: "Version does not belong to this page" }, { status: 400 });
    }

    // Prevent deleting the current version
    if (version.id === page.currentVersionId) {
      return NextResponse.json({ 
        error: "Cannot delete the current version. Please revert to another version first." 
      }, { status: 400 });
    }

    // Delete the version
    await prisma.pageVersion.delete({
      where: { id: params.versionId }
    });

    return NextResponse.json({ 
      success: true,
      message: "Version deleted successfully" 
    });

  } catch (error) {
    console.error('Error deleting version:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
