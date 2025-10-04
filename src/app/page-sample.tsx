// SAMPLE REFINED HOME PAGE - For review before applying
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
    <div className="space-y-8 pb-8">
      {/* Welcome Section - Refined with gradient and better typography */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl shadow-sm border border-slate-200/60 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            MWA Business Hub
          </h1>
          <p className="text-slate-600 mt-3 text-lg leading-relaxed">
            Your central access point for all business systems and resources
          </p>
        </div>
      </section>

      {/* Marsden Wealth Apps Section */}
      <MarsdenApps apps={marsdenApps} />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Links Section - Enhanced card styling */}
        <section className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Business Systems & Resources</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
              {categories.length} categories
            </span>
          </div>
          <HierarchicalLinks categories={categories} />
        </section>

        {/* Sidebar - Refined spacing */}
        <aside className="xl:col-span-1 space-y-6">
          {/* Wiki Knowledge Base Widget */}
          <WikiWidget />
        </aside>
      </div>
    </div>
  );
}
