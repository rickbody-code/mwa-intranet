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

  const sortedApps = apps.sort((a, b) => a.order - b.order);

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Marsden Wealth Apps</div>
          <div className="section-subtitle">One-tap internal tools</div>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{apps.length} apps</div>
      </div>
      
      <div className="apps-grid">
        {sortedApps.map((app) => {
          const IconComponent = (Icons as any)[app.icon] || Icons.Square;
          
          return (
            <Link
              key={app.id}
              href={app.url}
              target="_blank"
              className="app-card"
            >
              <div className="app-icon">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="app-name">{app.name}</div>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
                  {app.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
