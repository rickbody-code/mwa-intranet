import { prisma } from "@/lib/prisma";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { QuickLinkForm } from "@/components/QuickLinkForm";

export default async function AdminPage() {
  const [announcements, links] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.quickLink.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="card">
        <h1 className="h1 mb-4">Admin · Manage Announcements</h1>
        <AnnouncementForm existing={announcements} />
      </section>

      <section className="card">
        <h2 className="h2 mb-4">Manage Quick Links</h2>
        <QuickLinkForm existing={links} />
      </section>
    </div>
  );
}
