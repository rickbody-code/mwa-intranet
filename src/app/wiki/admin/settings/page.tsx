import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import Link from "next/link";
import {
  Settings,
  Save,
  Database,
  Shield,
  Bell,
  Palette,
  Globe,
  Mail,
  Server,
  HardDrive,
  Users,
  FileText,
  Search,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default async function WikiSettingsAdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/signin?callbackUrl=/wiki/admin/settings");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wiki Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Configure system-wide wiki settings and preferences
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
          
          <div className="p-6">
            <div className="space-y-8">
              {/* General Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  General Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="wikiName" className="block text-sm font-medium text-gray-700 mb-1">
                      Wiki Name
                    </label>
                    <input
                      type="text"
                      id="wikiName"
                      defaultValue="MWA Intranet Wiki"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="wikiDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      id="wikiDescription"
                      defaultValue="Marsden Wealth Advisers Knowledge Base"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="defaultStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Default Page Status
                    </label>
                    <select
                      id="defaultStatus"
                      defaultValue="DRAFT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 mb-1">
                      Max File Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      id="maxFileSize"
                      defaultValue="10"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Require Authentication</h3>
                      <p className="text-sm text-gray-500">All wiki access requires user authentication</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Enable Real-time Collaboration</h3>
                      <p className="text-sm text-gray-500">Allow multiple users to edit pages simultaneously</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Activity Logging</h3>
                      <p className="text-sm text-gray-500">Log all user actions and page changes</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Version Control</h3>
                      <p className="text-sm text-gray-500">Maintain version history for all pages</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Search Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Full-text Search</h3>
                      <p className="text-sm text-gray-500">Enable PostgreSQL full-text search capabilities</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Search Attachments</h3>
                      <p className="text-sm text-gray-500">Include file contents in search results</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="searchResultsLimit" className="block text-sm font-medium text-gray-700 mb-1">
                      Search Results Limit
                    </label>
                    <input
                      type="number"
                      id="searchResultsLimit"
                      defaultValue="50"
                      min="10"
                      max="200"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Storage Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2" />
                  Storage Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Storage Provider
                    </label>
                    <select
                      defaultValue="replit-object-storage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="replit-object-storage">Replit Object Storage</option>
                      <option value="local">Local Storage</option>
                      <option value="s3">Amazon S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Quota (GB)
                    </label>
                    <input
                      type="number"
                      defaultValue="10"
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Send email updates for page changes</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Real-time Updates</h3>
                      <p className="text-sm text-gray-500">Show live updates in the interface</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  System Maintenance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rebuild Search Index
                  </button>
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Export Wiki Data
                  </button>
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Wiki Data
                  </button>
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reset Wiki Data
                  </button>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  System Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Wiki Version:</span>
                    <span className="ml-2 text-gray-900">1.0.0</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Database:</span>
                    <span className="ml-2 text-gray-900">PostgreSQL</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Storage:</span>
                    <span className="ml-2 text-gray-900">Replit Object Storage</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Authentication:</span>
                    <span className="ml-2 text-gray-900">Microsoft Entra ID</span>
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