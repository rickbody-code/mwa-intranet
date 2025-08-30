"use client";
import { useEffect, useMemo, useState } from "react";

type Staff = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  department?: string | null;
  image?: string | null;
};

export function StaffDirectory({ staff }: { staff: Staff[] }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Staff[]>(staff || []);

  useEffect(() => {
    setItems(staff || []);
  }, [staff]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    if (!query) return items;
    return items.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      (s.title || "").toLowerCase().includes(query) ||
      (s.department || "").toLowerCase().includes(query) ||
      (s.location || "").toLowerCase().includes(query) ||
      (s.email || "").toLowerCase().includes(query)
    );
  }, [q, items]);

  return (
    <div className="space-y-4">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, team, location..." />
      {!filtered.length ? (
        <p className="text-gray-600">No staff match that search.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <li key={s.id} className="border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  {(s.name || "?").split(" ").map(p=>p[0]).slice(0,2).join("")}
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.title} {s.department ? ("· " + s.department) : ""}</div>
                  <div className="text-sm"><a className="link" href={`mailto:${s.email}`}>{s.email}</a></div>
                  {s.location && <div className="text-xs text-gray-500">{s.location}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
