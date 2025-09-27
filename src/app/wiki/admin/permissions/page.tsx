import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Shield,
  Lock,
  Unlock,
  User,
  Users,
  Eye,
  Edit,
  Settings,
  Plus,
  Trash2,
  Search,
  AlertTriangle
} from "lucide-react";

async function getPermissionsData() {
  const [
    pagePermissions,
    pages,
    users,
    permissionStats
  ] = await Promise.all([
    prisma.pagePermission.findMany({
      include: {
        page: { select: { id: true, title: true, slug: true, status: true } },
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.page.findMany({
      select: { id: true, title: true, slug: true, status: true },
      orderBy: { title: 'asc' }
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    }),
    prisma.pagePermission.groupBy({
      by: ['canRead', 'canWrite', 'canAdmin'],
      _count: { id: true }
    })
  ]);

  return {
    pagePermissions,
    pages,
    users,
    permissionStats
  };
}

export default async function WikiPermissionsAdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/signin?callbackUrl=/wiki/admin/permissions");
  }

  const { pagePermissions, pages, users, permissionStats } = await getPermissionsData();

  const getPermissionLevel = (permission: any) => {
    if (permission.canAdmin) return { level: 'Admin', color: 'bg-red-100 text-red-800' };
    if (permission.canWrite) return { level: 'Write', color: 'bg-yellow-100 text-yellow-800' };
    if (permission.canRead) return { level: 'Read', color: 'bg-green-100 text-green-800' };
    return { level: 'None', color: 'bg-gray-100 text-gray-800' };
  };

  const getPermissionIcon = (permission: any) => {
    if (permission.canAdmin) return <Shield className="w-4 h-4 text-red-600" />;
    if (permission.canWrite) return <Edit className="w-4 h-4 text-yellow-600" />;
    if (permission.canRead) return <Eye className="w-4 h-4 text-green-600" />;
    return <Lock className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Control access to wiki pages and manage user permissions
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permission
                </button>
                <Link
                  href="/wiki/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
          
          {/* Permission Stats */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Permissions</p>
                    <p className="text-2xl font-bold text-blue-900">{pagePermissions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Eye className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Read Access</p>
                    <p className="text-2xl font-bold text-green-900">
                      {pagePermissions.filter(p => p.canRead).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Edit className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Write Access</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {pagePermissions.filter(p => p.canWrite).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Settings className="w-8 h-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Admin Access</p>
                    <p className="text-2xl font-bold text-red-900">
                      {pagePermissions.filter(p => p.canAdmin).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Alert */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Published pages are readable by all authenticated users by default. 
                    Use explicit permissions to restrict access to sensitive content.
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions Table */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Page Permissions</h2>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Access Rights
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagePermissions.map((permission) => {
                      const permissionLevel = getPermissionLevel(permission);
                      return (
                        <tr key={permission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.page?.title || 'Unknown Page'}
                              </div>
                              <div className="text-sm text-gray-500 ml-2">
                                ({permission.page?.status})
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.user?.name || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {permission.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPermissionIcon(permission)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${permissionLevel.color}`}>
                                {permissionLevel.level}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              {permission.canRead && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Read
                                </span>
                              )}
                              {permission.canWrite && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Edit className="w-3 h-3 mr-1" />
                                  Write
                                </span>
                              )}
                              {permission.canAdmin && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Permission"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                title="Remove Permission"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagePermissions.length === 0 && (
                <div className="text-center py-12">
                  <Lock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No explicit permissions set</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All users follow default access rules. Create explicit permissions for sensitive content.
                  </p>
                  <div className="mt-6">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Permission
                    </button>
                  </div>
                </div>
              )}

              {/* Default Permissions Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Default Access Rules</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Published pages:</strong> Readable by all authenticated users</li>
                  <li>• <strong>Draft pages:</strong> Only accessible to the author and admins</li>
                  <li>• <strong>Page editing:</strong> Only allowed for authors and admins</li>
                  <li>• <strong>Admin functions:</strong> Reserved for users with ADMIN role</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}