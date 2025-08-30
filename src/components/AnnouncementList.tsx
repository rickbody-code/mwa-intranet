"use client";
import { useState } from "react";
import { Megaphone, Pin } from "lucide-react";

export function AnnouncementList({ announcements }: { announcements: any[] }) {
  const [items] = useState(announcements);

  if (!items?.length) return <p className="text-gray-600">No announcements yet.</p>;

  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="border rounded-xl p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Megaphone className="w-4 h-4" />
            <span>{new Date(a.createdAt).toLocaleString()}</span>
            {a.pinned && <span className="badge"><Pin className="w-3 h-3 mr-1" />Pinned</span>}
          </div>
          <h3 className="text-lg font-semibold">{a.title}</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
