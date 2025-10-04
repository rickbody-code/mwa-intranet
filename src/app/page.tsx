// src/app/page.tsx (Updated with Marsden Apps)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { HierarchicalLinks } from "@/components/HierarchicalLinks";
import { MarsdenApps } from "@/components/MarsdenApps";
import { WikiWidget } from "@/components/wiki/WikiWidget";

// Type adapter to convert Prisma's null to undefined for component compatibility
function adaptCategories(categories: any[]): any[] {
  return categories.map(cat => ({
    ...cat,
    description: cat.description ?? undefined,
    links: cat.links.map((link: any) => ({
      ...link,
      description: link.description ?? undefined,
      createdBy: link.createdBy ?? undefined
    })),
    subCategories: cat.subCategories.map((subCat: any) => ({
      ...subCat,
      description: subCat.description ?? undefined,
      links: subCat.links.map((link: any) => ({
        ...link,
        description: link.description ?? undefined,
        createdBy: link.createdBy ?? undefined
      })),
      subSubCategories: subCat.subSubCategories.map((subSubCat: any) => ({
        ...subSubCat,
        description: subSubCat.description ?? undefined,
        links: subSubCat.links.map((link: any) => ({
          ...link,
          description: link.description ?? undefined,
          createdBy: link.createdBy ?? undefined
        }))
      }))
    }))
  }));
}

export default async function Home() {
  const [categoriesRaw, marsdenApps] = await Promise.all([
    prisma.linkCategory.findMany({
      include: {
        links: {
          orderBy: [{ order: "asc" }, { title: "asc" }]
        },
        subCategories: {
          include: {
            links: {
              orderBy: [{ order: "asc" }, { title: "asc" }]
            },
            subSubCategories: {
              include: {
                links: {
                  orderBy: [{ order: "asc" }, { title: "asc" }]
                }
              },
              orderBy: [{ order: "asc" }, { name: "asc" }]
            }
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    }),
    prisma.marsdenApp.findMany({ orderBy: { order: "asc" } })
  ]);

  // Adapt the categories to match component expectations
  const categories = adaptCategories(categoriesRaw);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="welcome-card">
        <h2>Welcome to Your Workspace</h2>
        <p>Your central hub for company resources, tools, and information. Everything you need to deliver exceptional service to our clients.</p>
      </section>

      {/* Marsden Wealth Apps Section - New addition */}
      <MarsdenApps apps={marsdenApps} />

      <div className="business-layout">
        {/* Main Links Section */}
        <section className="business-systems">
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <div className="section-title">Business Systems & Resources</div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{categories.length} categories</div>
          </div>
          <HierarchicalLinks categories={categories} />
        </section>

        {/* Sidebar */}
        <aside>
          {/* Wiki Knowledge Base Widget */}
          <WikiWidget />
        </aside>
      </div>
    </div>
  );
}
