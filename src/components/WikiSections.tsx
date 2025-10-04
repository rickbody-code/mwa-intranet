"use client";
import Link from "next/link";
import * as Icons from "lucide-react";

type WikiSection = {
  id: string;
  title: string;
  description: string;
  icon: string;
  linkText: string;
  linkUrl: string;
  order: number;
};

export function WikiSections({ sections }: { sections: WikiSection[] }) {
  if (!sections?.length) return null;

  const sortedSections = sections.sort((a, b) => a.order - b.order);

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedSections.map((section) => {
          const IconComponent = (Icons as any)[section.icon] || Icons.FileText;
          
          return (
            <div
              key={section.id}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 min-h-[3rem]">
                {section.description}
              </p>
              
              <Link
                href={section.linkUrl}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                {section.linkText}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
