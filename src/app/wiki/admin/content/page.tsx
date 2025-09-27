import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  User,
  Archive,
  Plus,
  Search,
  Filter,
  Download
} from "lucide-react";

async function getContentStats() {
  const [
    totalPages,
    publishedPages,
    draftPages,
    archivedPages,
    totalTags,
    totalViews,
    recentPages
  ] = await Promise.all([
    prisma.page.count(),
    prisma.page.count({ where: { status: 'PUBLISHED' } }),
    prisma.page.count({ where: { status: 'DRAFT' } }),
    prisma.page.count({ where: { status: 'ARCHIVED' } }),
    prisma.tag.count(),
    prisma.page.aggregate({ _sum: { viewCount: true } }),
    prisma.page.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        _count: { select: { tags: true } }
      }
    })
  ]);

  return {
    totalPages,
    publishedPages,
    draftPages,
    archivedPages,
    totalTags,
    totalViews: totalViews._sum.viewCount || 0,
    recentPages
  };
}

export default async function WikiContentAdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/signin?callbackUrl=/wiki/admin/content");
  }

  const stats = await getContentStats();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage wiki pages, tags, and content organization
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/wiki/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Page
                </Link>
                <Link
                  href="/wiki/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
          
          {/* Content Stats */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Pages</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalPages}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Eye className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Published</p>
                    <p className="text-2xl font-bold text-green-900">{stats.publishedPages}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Edit className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Drafts</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.draftPages}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Tag className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Tags</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalTags}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Pages */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Pages</h2>
                <div className="flex space-x-2">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentPages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {page.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {page.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(page.status)}`}>
                            {page.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {page.updatedBy.name || page.updatedBy.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {formatDate(page.updatedAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 text-gray-400 mr-1" />
                            {page.viewCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/wiki/pages/${page.slug || page.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/wiki/pages/${page.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            {page.status !== 'ARCHIVED' && (
                              <button
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {stats.recentPages.length} of {stats.totalPages} pages
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}