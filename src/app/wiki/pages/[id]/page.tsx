import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Clock, User, Eye, FileText, Tag } from 'lucide-react';
import VersionHistory from '@/components/wiki/VersionHistory';

interface PageProps {
  params: { id: string };
  searchParams: { version?: string };
}

async function getWikiPage(id: string, versionId?: string, userRole?: string, userId?: string) {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Try to find page by ID or slug
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        currentVersion: true,
        tags: { include: { tag: true } },
        parent: { select: { id: true, title: true, slug: true } },
        children: { 
          select: { id: true, title: true, slug: true, status: true },
          where: userRole === "ADMIN" ? {} : {
            OR: [
              { status: "PUBLISHED" },
              { createdById: userId },
              {
                permissions: {
                  some: {
                    OR: [
                      { userId: userId, canRead: true },
                      { role: userRole, canRead: true }
                    ]
                  }
                }
              }
            ]
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            size: true,
            contentType: true,
            uploadedBy: { select: { name: true } },
            createdAt: true
          }
        }
      }
    });

    if (!page) return null;

    // Store the actual latest version ID
    const actualCurrentVersionId = page.currentVersion?.id;

    // If specific version requested, get that version
    if (versionId) {
      const version = await prisma.pageVersion.findUnique({
        where: { id: versionId },
        include: {
          createdBy: { select: { name: true, email: true } }
        }
      });
      
      if (version && version.pageId === page.id) {
        return {
          ...page,
          currentVersion: version,
          actualCurrentVersionId
        };
      }
    }

    return { ...page, actualCurrentVersionId };
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  const page = await getWikiPage(params.id, searchParams.version, session?.user?.role, session?.user?.id);
  
  if (!page) {
    return {
      title: 'Page Not Found | MWA Wiki',
      description: 'The requested wiki page could not be found.'
    };
  }
  
  const isHistoricalVersion = searchParams.version && searchParams.version !== page.currentVersion?.id;
  
  return {
    title: `${page.title}${isHistoricalVersion ? ' (Historical Version)' : ''} | MWA Wiki`,
    description: page.summary || `Wiki page: ${page.title}`
  };
}

export default async function WikiPageView({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!user) {
    redirect('/');
  }

  const page = await getWikiPage(params.id, searchParams.version, user.role, user.id);
  
  if (!page) {
    notFound();
  }

  const isHistoricalVersion = searchParams.version && searchParams.version !== page.currentVersion?.id;
  const canEdit = user.role === 'ADMIN' || page.createdBy?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/wiki"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Wiki</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              {isHistoricalVersion && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg">
                  Historical Version
                </div>
              )}
              
              {canEdit && !isHistoricalVersion && (
                <Link
                  href={`/wiki/edit/${params.id}`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Page Header */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {page.title}
                </h1>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Created by {page.createdBy?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{page._count?.views || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{page._count?.versions || 0} versions</span>
                  </div>
                </div>

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {page.tags.map((pageTag: any) => (
                        <span
                          key={pageTag.tag.id}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {pageTag.tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {isHistoricalVersion && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      You are viewing a historical version of this page from{' '}
                      {new Date(page.version?.createdAt || page.createdAt).toLocaleString()}.{' '}
                      <Link 
                        href={`/wiki/pages/${params.id}`}
                        className="font-medium underline hover:no-underline"
                      >
                        View current version
                      </Link>
                    </p>
                  </div>
                )}
                
                {/* Render the page content */}
                <div className="prose max-w-none">
                  {page.version?.contentMarkdown || page.currentVersion?.contentMarkdown ? (
                    <div 
                      className="wiki-content"
                      dangerouslySetInnerHTML={{
                        __html: (page.version?.contentMarkdown || page.currentVersion?.contentMarkdown)
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                      }}
                    />
                  ) : (
                    <p className="text-gray-600 italic">No content available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            {page.attachments && page.attachments.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {page.attachments.map((attachment: any) => (
                      <div key={attachment.id} className="flex items-center space-x-3 p-3 border rounded">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{attachment.originalName}</div>
                          <div className="text-sm text-gray-500">
                            {attachment.contentType} • {Math.round(attachment.size / 1024)} KB
                          </div>
                        </div>
                        <a
                          href={`/api/wiki/attachments/${attachment.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Version History */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-3 border-b">
                  <h2 className="font-semibold text-gray-900">Version History</h2>
                </div>
                <div className="p-4">
                  <VersionHistory 
                    pageId={params.id}
                    currentVersionId={page.actualCurrentVersionId}
                  />
                </div>
              </div>

              {/* Page Info */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-3 border-b">
                  <h2 className="font-semibold text-gray-900">Page Information</h2>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      page.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      page.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{new Date(page.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2">{new Date(page.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {page.parent && (
                    <div>
                      <span className="text-gray-600">Parent:</span>
                      <Link 
                        href={`/wiki/pages/${page.parent.id}`}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        {page.parent.title}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}