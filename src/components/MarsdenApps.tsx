"use client";
import Link from "next/link";
import * as Icons from "lucide-react";

type MarsdenApp = {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  order: number;
};

export function MarsdenApps({ apps }: { apps: MarsdenApp[] }) {
  if (!apps?.length) return null;

  // Sort apps by order
  const sortedApps = apps.sort((a, b) => a.order - b.order);

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Marsden Wealth Apps</h2>
          <p className="text-gray-600 text-sm mt-1">One-tap internal tools</p>
        </div>
        <span className="text-sm text-gray-500">{apps.length} apps</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedApps.map((app) => {
          // Get the icon component dynamically
          const IconComponent = (Icons as any)[app.icon] || Icons.Square;
          
          return (
            <Link
              key={app.id}
              href={app.url}
              target="_blank"
              className="group relative bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition-colors border border-gray-700 hover:border-gray-600"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white group-hover:text-gray-100 text-sm">
                    {app.name}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                    {app.description}
                  </p>
                </div>
              </div>
              
              {/* Hover indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}