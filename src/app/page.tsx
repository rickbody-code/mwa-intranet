export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import { AnnouncementList } from "@/components/AnnouncementList";
import { QuickLinks } from "@/components/QuickLinks";
import { StaffDirectory } from "@/components/StaffDirectory";
import { Search } from "@/components/Search";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const [announcements, links, staff] = await Promise.all([
    prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 6 }),
    prisma.quickLink.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.staff.findMany({ orderBy: { name: "asc" }, take: 50 }),
  ]);

  // Debug info
  const session = await getServerSession(authOptions);
  const adminEmailsRaw = process.env.ADMIN_EMAILS;
  const adminList = (adminEmailsRaw || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const currentUserEmail = session?.user?.email?.toLowerCase();
  const isInAdminList = adminList.includes(currentUserEmail || '');

  return (
    <div className="space-y-6">
      {/* DEBUG INFO - TEMPORARY */}
      <div className="card bg-yellow-50 border-2 border-yellow-400">
        <h2 className="text-xl font-bold mb-4 text-red-600">🚨 DEBUG INFO (TEMPORARY)</h2>
        <div className="text-sm space-y-2 font-mono">
          <div><strong>Admin Emails (Raw):</strong> <span className="bg-gray-100 p-1">{adminEmailsRaw || '❌ NOT SET'}</span></div>
          <div><strong>Admin List (Parsed):</strong> <span className="bg-gray-100 p-1">{JSON.stringify(adminList)}</span></div>
          <div><strong>Your Email:</strong> <span className="bg-gray-100 p-1">{currentUserEmail || '❌ NOT SIGNED IN'}</span></div>
          <div><strong>Your Role:</strong> <span className="bg-gray-100 p-1">{(session as any)?.role || '❌ NO ROLE'}</span></div>
          <div><strong>Is In Admin List:</strong> <span className="bg-gray-100 p-1">{isInAdminList ? '✅ YES' : '❌ NO'}</span></div>
          <div><strong>Session Exists:</strong> <span className="bg-gray-100 p-1">{session ? '✅ YES' : '❌ NO'}</span></div>
          <div><strong>Session User:</strong> <span className="bg-gray-100 p-1">{JSON.stringify(session?.user) || '❌ NO USER DATA'}</span></div>
          <div><strong>Full Session:</strong> <span className="bg-gray-100 p-1 text-xs">{JSON.stringify(session)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h1 className="h1">Announcements</h1>
          </div>
          <AnnouncementList announcements={announcements} />
        </section>

        <aside className="xl:col-span-1 space-y-6">
          <div className="card">
            <h2 className="h2 mb-3">Search</h2>
            <Search />
          </div>
          <div className="card">
            <h2 className="h2 mb-3">Quick Links</h2>
            <QuickLinks links={links} />
          </div>
        </aside>

        <section className="xl:col-span-3 card">
          <h2 className="h2 mb-4">Staff Directory</h2>
          <StaffDirectory staff={staff} />
        </section>
      </div>
    </div>
  );
}
