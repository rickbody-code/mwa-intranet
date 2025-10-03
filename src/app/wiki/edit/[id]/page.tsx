import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import WikiPageForm from '@/components/wiki/WikiPageForm';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: { id: string };
}

async function getPageForEdit(id: string, userId: string, userRole: string) {
  try {
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        currentVersion: true,
        tags: { include: { tag: true } }
      }
    });

    if (!page) return null;

    // Check edit permissions
    const canEdit = userRole === 'ADMIN' || page.createdById === userId;
    
    if (!canEdit) {
      return null;
    }

    return page;
  } catch (error) {
    console.error('Error fetching page for edit:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  }) : null;

  if (!user) {
    return {
      title: 'Edit Page | MWA Wiki',
      description: 'Edit wiki page'
    };
  }

  const page = await getPageForEdit(params.id, user.id, user.role);
  
  if (!page) {
    return {
      title: 'Page Not Found | MWA Wiki',
      description: 'The requested wiki page could not be found or you do not have permission to edit it.'
    };
  }
  
  return {
    title: `Edit: ${page.title} | MWA Wiki`,
    description: `Edit wiki page: ${page.title}`
  };
}

export default async function EditWikiPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!user) {
    redirect('/');
  }

  const page = await getPageForEdit(params.id, user.id, user.role);
  
  if (!page) {
    notFound();
  }

  // Prepare initial data for the form
  const initialData = {
    id: page.id,
    title: page.title,
    content: page.currentVersion?.contentJSON || null,
    status: page.status,
    tags: page.tags.map(t => t.tag.name),
    parentId: page.parentId || undefined,
    summary: page.summary || undefined
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/wiki/pages/${page.slug || page.id}`}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Page</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Edit Page</h2>
            </div>
            <p className="text-gray-600 mt-1">
              Make changes to your wiki page
            </p>
          </div>
          
          <div className="p-6">
            <WikiPageForm 
              mode="edit"
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
