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
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="h1">MWA Business Hub</h1>
            <p className="text-gray-600 mt-1">Your central access point for all business systems and resources</p>
          </div>
        </div>
      </section>

      {/* Marsden Wealth Apps Section - New addition */}
      <MarsdenApps apps={marsdenApps} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Links Section */}
        <section className="xl:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h2">Business Systems & Resources</h2>
            <span className="text-sm text-gray-500">{categories.length} categories</span>
          </div>
          <HierarchicalLinks categories={categories} />
        </section>

        {/* Sidebar */}
        <aside className="xl:col-span-1 space-y-6">
          {/* Wiki Knowledge Base Widget */}
          <WikiWidget />
        </aside>
      </div>
    </div>
  );
}
