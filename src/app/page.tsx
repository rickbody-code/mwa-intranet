import { prisma } from "@/lib/prisma";
import { AnnouncementList } from "@/components/AnnouncementList";
import { QuickLinks } from "@/components/QuickLinks";
import { StaffDirectory } from "@/components/StaffDirectory";
import { Search } from "@/components/Search";

export default async function Home() {
  const [announcements, links, staff] = await Promise.all([
    prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 6 }),
    prisma.quickLink.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.staff.findMany({ orderBy: { name: "asc" }, take: 50 }),
  ]);

  return (
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
  );
}
