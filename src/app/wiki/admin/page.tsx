import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import Link from "next/link";
import {
  Users,
  FileText,
  Settings,
  Activity,
  BarChart3,
  Shield,
  Clock,
  Database
} from "lucide-react";

export default async function WikiAdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/signin?callbackUrl=/wiki/admin");
  }

  const adminSections = [
    {
      title: "Activity Logs",
      description: "View all wiki activities and audit trail",
      icon: Activity,
      href: "/wiki/admin/activity",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "User Management",
      description: "Manage user permissions and roles",
      icon: Users,
      href: "/wiki/admin/users",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Content Management",
      description: "Manage pages, tags, and categories",
      icon: FileText,
      href: "/wiki/admin/content",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "System Stats",
      description: "View system usage and analytics",
      icon: BarChart3,
      href: "/wiki/admin/stats",
      color: "bg-yellow-50 text-yellow-600"
    },
    {
      title: "Permissions",
      description: "Configure access control and security",
      icon: Shield,
      href: "/wiki/admin/permissions",
      color: "bg-red-50 text-red-600"
    },
    {
      title: "Settings",
      description: "System configuration and preferences",
      icon: Settings,
      href: "/wiki/admin/settings",
      color: "bg-gray-50 text-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wiki Administration</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your wiki system, users, and content
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/wiki"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Wiki
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.title}
                    href={section.href}
                    className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${section.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Stats Section */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Database className="w-6 h-6 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Pages</p>
                      <p className="text-2xl font-bold text-blue-900">--</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-6 h-6 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Active Users</p>
                      <p className="text-2xl font-bold text-green-900">--</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="w-6 h-6 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Today's Activity</p>
                      <p className="text-2xl font-bold text-purple-900">--</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Total Views</p>
                      <p className="text-2xl font-bold text-yellow-900">--</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}