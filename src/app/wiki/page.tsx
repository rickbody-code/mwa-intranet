import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Tag
} from "lucide-react";
import WikiSearch from "@/components/wiki/WikiSearch";
import WikiTagSearch from "@/components/wiki/WikiTagSearch";
import WikiFeaturedContent from "@/components/wiki/WikiFeaturedContent";
import CollapsiblePagesList from "@/components/wiki/CollapsiblePagesList";
import { WikiSections } from "@/components/WikiSections";

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

  const availableTags = allTags.filter(tag => tag.pages.length > 0).map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    pageCount: tag.pages.length
  }));

  // Get wiki sections
  const wikiSections = await prisma.wikiSection.findMany({
    orderBy: { order: 'asc' }
  });

  return (
    <>
      {/* Welcome Header Section */}
      <section className="welcome-card" style={{ marginBottom: '2rem' }}>
        <h2>Marsden Wealth Advisers Knowledge Base</h2>
        <p>Your central hub for compliance, processes, tools, and best practices to deliver exceptional financial advice.</p>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Wiki Sections */}
        <WikiSections sections={wikiSections} />
        {/* Header - Just New Page button */}
        <div className="flex items-center justify-end mb-8">
          <Link
            href="/wiki/create"
            className="new-page-btn"
          >
            <Plus className="w-4 h-4" />
            New Page
          </Link>
        </div>

      {/* Featured Content Section */}
      <div className="mb-8">
        <WikiFeaturedContent isAdmin={user.role === 'ADMIN'} />
      </div>

      {/* Search Section - Split into two halves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Search Wiki Pages */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            Search Wiki Pages
          </h2>
          <WikiSearch />
        </div>

        {/* Search Tags */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            Search Tags
          </h2>
          <WikiTagSearch tags={availableTags} />
        </div>
      </div>

      {/* Collapsible Pages List */}
      <CollapsiblePagesList pages={transformedPages} />
    </div>
    </>
  );
}