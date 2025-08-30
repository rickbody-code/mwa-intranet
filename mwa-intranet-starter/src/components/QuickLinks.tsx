"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function QuickLinks({ links }: { links: any[] }) {
  if (!links?.length) return <p className="text-gray-600">No quick links yet.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {links.map((l) => (
        <Link key={l.id} href={l.url} target="_blank" className="border rounded-xl px-3 py-2 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="font-medium">{l.label}</span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </div>
        </Link>
      ))}
    </div>
  );
}
