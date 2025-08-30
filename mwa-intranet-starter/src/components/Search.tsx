"use client";
import { useState } from "react";

export function Search() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const [staffRes, annRes, linksRes] = await Promise.all([
        fetch(`/api/staff?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`/api/announcements`).then(r => r.json()),
        fetch(`/api/links`).then(r => r.json()),
      ]);
      const anns = annRes.filter((a: any) =>
        a.title?.toLowerCase().includes(q.toLowerCase()) ||
        a.body?.toLowerCase().includes(q.toLowerCase())
      ).map((a:any) => ({ type: "Announcement", title: a.title, id: a.id }));

      const links = linksRes.filter((l: any) =>
        l.label?.toLowerCase().includes(q.toLowerCase())
      ).map((l:any) => ({ type: "Link", title: l.label, url: l.url }));

      const staff = staffRes.map((s:any) => ({ type: "Staff", title: s.name, email: s.email }));

      setResult([...anns, ...links, ...staff]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={onSearch}>
        <input className="input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search announcements, links, people..." />
        <button className="btn btn-primary" type="submit" disabled={!q || loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {!!result.length && (
        <ul className="space-y-2">
          {result.map((r, i) => (
            <li key={i} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{r.type}</div>
                <div className="font-medium">{r.title}</div>
              </div>
              {r.url && <a className="link" href={r.url} target="_blank">Open</a>}
              {r.email && <a className="link" href={`mailto:${r.email}`}>Email</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
