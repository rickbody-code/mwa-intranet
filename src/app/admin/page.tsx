// src/app/admin/page.tsx (Integrated Version)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import { HierarchicalLinksAdmin } from "@/components/HierarchicalLinksAdmin";
import { MarsdenAppsAdmin } from "@/components/MarsdenAppsAdmin";

export default async function AdminPage() {
  // Fetch both hierarchical data AND marsden apps
  const [categories, marsdenApps] = await Promise.all([
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

  return (
    <div className="space-y-8">
      {/* NEW: Marsden Apps Admin Section */}
      <section className="card">
        <h1 className="h1 mb-4">Admin · Manage Marsden Wealth Apps</h1>
        <p className="text-gray-600 mb-6">Create and manage your internal app shortcuts with custom icons and descriptions.</p>
        <MarsdenAppsAdmin initialApps={marsdenApps} />
      </section>

      {/* EXISTING: Your Business Systems Management */}
      <section className="card">
        <h1 className="h1 mb-4">Admin · Business Systems Management</h1>
        <p className="text-gray-600 mb-6">
          Organize your business links into a hierarchical structure. 
          Categories → Subcategories → Sub-subcategories → Links
        </p>
        <HierarchicalLinksAdmin initialData={categories} />
      </section>

      {/* EXISTING: Your Migration Helper */}
      <section className="card bg-blue-50 border-blue-200">
        <h2 className="h2 mb-4">📄 Migration Status</h2>
        <p className="text-sm text-blue-800 mb-4">
          The new hierarchical link system is ready. Your existing Quick Links can be migrated 
          to the appropriate categories when you're ready.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">New System Features:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• 3-level hierarchy (Category → Sub → Sub-Sub)</li>
              <li>• Alphabetical sorting within each level</li>
              <li>• Expandable folder interface</li>
              <li>• Future-proof for growth</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Ready Categories:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Knowledge Topics</li>
              <li>• MSA Website</li>
              <li>• MSA Resources</li>
              <li>• Foreign Country Info</li>
              <li>• Product Adviser Sites</li>
              <li>• MSA Applications</li>
              <li>• CPAL</li>
              <li>• Third Party Authorities</li>
              <li>• Competitor Websites</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}