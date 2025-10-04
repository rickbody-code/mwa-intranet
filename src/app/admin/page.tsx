// src/app/admin/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { HierarchicalLinksAdmin } from "@/components/HierarchicalLinksAdmin";
import { MarsdenAppsAdmin } from "@/components/MarsdenAppsAdmin";
import { WikiSectionsAdmin } from "@/components/WikiSectionsAdmin";

// Type adapter to convert Prisma's null to undefined for component compatibility
function adaptCategories(categories: any[]): any[] {
  return categories.map(cat => ({
    ...cat,
    links: cat.links.map((link: any) => ({
      ...link,
      description: link.description ?? undefined, // Convert null to undefined
      createdBy: link.createdBy ?? undefined
    })),
    subCategories: cat.subCategories.map((subCat: any) => ({
      ...subCat,
      links: subCat.links.map((link: any) => ({
        ...link,
        description: link.description ?? undefined,
        createdBy: link.createdBy ?? undefined
      })),
      subSubCategories: subCat.subSubCategories.map((subSubCat: any) => ({
        ...subSubCat,
        links: subSubCat.links.map((link: any) => ({
          ...link,
          description: link.description ?? undefined,
          createdBy: link.createdBy ?? undefined
        }))
      }))
    }))
  }));
}

export default async function AdminPage() {
  const [categoriesRaw, marsdenApps, wikiSections] = await Promise.all([
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
    prisma.marsdenApp.findMany({ orderBy: { order: "asc" } }),
    prisma.wikiSection.findMany({ orderBy: { order: "asc" } })
  ]);

  // Adapt the categories to match component expectations
  const categories = adaptCategories(categoriesRaw);

  return (
    <div className="space-y-8">
      {/* NEW: Marsden Apps Admin Section */}
      <section className="card">
        <h1 className="h1 mb-4">Admin · Manage Marsden Apps</h1>
        <p className="text-gray-600 mb-6">
          Manage the featured Marsden Wealth applications that appear on the homepage
        </p>
        <MarsdenAppsAdmin initialApps={marsdenApps} />
      </section>

      {/* NEW: Wiki Sections Admin Section */}
      <section className="card">
        <h2 className="h2 mb-4">Admin · Manage Wiki Sections</h2>
        <p className="text-gray-600 mb-6">
          Manage the white card sections that appear on the Wiki Knowledge Base homepage
        </p>
        <WikiSectionsAdmin initialSections={wikiSections} />
      </section>

      {/* NEW: Hierarchical Links Admin Section */}
      <section className="card">
        <h2 className="h2 mb-4">Manage Business Systems & Resources</h2>
        <p className="text-gray-600 mb-6">
          Organize links in a hierarchical structure:<br />
          Categories → Subcategories → Sub-subcategories → Links
        </p>
        <HierarchicalLinksAdmin initialData={categories} />
      </section>
    </div>
  );
}
