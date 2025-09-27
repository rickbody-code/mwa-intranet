import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Eye, 
  Calendar, 
  Tag, 
  User,
  Filter,
  Grid,
  List
} from "lucide-react";
import WikiSearch from "@/components/wiki/WikiSearch";

export default async function WikiBrowsePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/");
  }

  // Base query for pages user can access
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

  // Get all accessible pages
  const pages = await prisma.page.findMany({
    where: baseWhere,
    include: {
      createdBy: {
        select: { name: true, email: true }
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: { 
          versions: true,
          attachments: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  // Get all tags for filtering
  const allTags = await prisma.tag.findMany({
    include: {
      pages: {
        where: { page: baseWhere }
      }
    },
    orderBy: { name: "asc" }
  });

  // Transform data
  const transformedPages = pages.map(page => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    path: page.path,
    summary: page.summary,
    status: page.status,
    viewCount: page.viewCount,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    author: {
      name: page.createdBy?.name || "Unknown",
      email: page.createdBy?.email
    },
    tags: page.tags.map(pt => ({
      id: pt.tag.id,
      name: pt.tag.name,
      color: pt.tag.color
    })),
    versionsCount: page._count.versions,
    attachmentsCount: page._count.attachments
  }));

  const availableTags = allTags.filter(tag => tag.pages.length > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Wiki Knowledge Base
          </h1>
          <p className="text-gray-600 mt-2">
            Browse and discover all wiki content
          </p>
        </div>
        <Link
          href="/wiki/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Link>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-600" />
          Search Wiki Pages
        </h2>
        <WikiSearch />
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Total Pages</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{transformedPages.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Total Views</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {transformedPages.reduce((total, page) => total + page.viewCount, 0).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Tag className="w-5 h-5" />
            <span className="font-medium">Available Tags</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{availableTags.length}</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <User className="w-5 h-5" />
            <span className="font-medium">Contributors</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {new Set(transformedPages.map(p => p.author.email).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <List className="w-5 h-5 text-gray-600" />
            All Wiki Pages
          </h2>
        </div>
        
        {transformedPages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {transformedPages.map((page) => (
              <div key={page.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/wiki${page.path}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {page.title}
                    </Link>
                    
                    {page.summary && (
                      <p className="text-gray-600 mt-2 line-clamp-2">{page.summary}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {page.author.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {page.viewCount} views
                      </div>
                      {page.versionsCount > 1 && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {page.versionsCount} versions
                        </div>
                      )}
                    </div>
                    
                    {page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {page.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                              color: tag.color || '#6b7280'
                            }}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      page.status === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800'
                        : page.status === 'DRAFT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No wiki pages yet</h3>
            <p className="mb-4">Get started by creating your first wiki page.</p>
            <Link
              href="/wiki/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Page
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}