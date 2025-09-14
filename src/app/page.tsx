// src/app/page.tsx (Updated with Marsden Apps)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { HierarchicalLinks } from "@/components/HierarchicalLinks";
import { Search } from "@/components/Search";
import { MarsdenApps } from "@/components/MarsdenApps";

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
      {/* Test Version Indicator */}
      <div className="bg-yellow-200 border-2 border-yellow-400 p-4 rounded-lg">
        <h2 className="font-bold text-yellow-800">HOMEPAGE - HIERARCHICAL LINKS + MARSDEN APPS VERSION LOADED</h2>
        <p className="text-yellow-700">If you see this yellow box, the new homepage with hierarchical links AND Marsden Apps is active.</p>
      </div>

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
          <div className="card">
            <h2 className="h2 mb-3">Search</h2>
            <Search />
          </div>
          
          {/* Quick Stats - Updated to include apps */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Marsden Apps:</span>
                <span className="font-medium">{marsdenApps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categories:</span>
                <span className="font-medium">{categories.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Links:</span>
                <span className="font-medium">
                  {categories.reduce((total, cat) => 
                    total + cat.links.length + 
                    cat.subCategories.reduce((subTotal, subCat) => 
                      subTotal + subCat.links.length + 
                      subCat.subSubCategories.reduce((subSubTotal, subSubCat) => 
                        subSubTotal + subSubCat.links.length, 0), 0), 0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Links organized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Marsden Apps ready</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
