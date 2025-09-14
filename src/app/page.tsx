// src/app/page.tsx (Updated)
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { HierarchicalLinks } from "@/components/HierarchicalLinks";
import { Search } from "@/components/Search";

export default async function Home() {
  const categories = await prisma.linkCategory.findMany({
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
  });

  return (
    <div className="space-y-6">
      {/* Test Version Indicator */}
      <div className="bg-yellow-200 border-2 border-yellow-400 p-4 rounded-lg">
        <h2 className="font-bold text-yellow-800">HOMEPAGE - HIERARCHICAL LINKS VERSION LOADED</h2>
        <p className="text-yellow-700">If you see this yellow box, the new homepage with hierarchical links is active.</p>
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
          
          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
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

          {/* Recent Updates */}
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
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}