import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import ActivityLog from "@/components/wiki/ActivityLog";

export default async function WikiActivityPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/signin?callbackUrl=/wiki/admin/activity");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wiki Activity Log</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track all wiki activities including page creation, updates, and user actions
                </p>
              </div>
              <div className="flex space-x-3">
                <a
                  href="/wiki"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Wiki
                </a>
                <a
                  href="/wiki/admin"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Admin Dashboard
                </a>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <ActivityLog 
              showPageInfo={true}
              limit={50}
              className="max-w-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}