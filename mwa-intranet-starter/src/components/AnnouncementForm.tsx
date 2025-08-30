"use client";
import { useState } from "react";

export function AnnouncementForm({ existing }: { existing: any[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [items, setItems] = useState(existing || []);
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", { method: "POST", body: JSON.stringify({ title, body, pinned }) });
      if (res.ok) {
        const item = await res.json();
        setItems([item, ...items]);
        setTitle(""); setBody(""); setPinned(false);
      } else {
        alert("Failed to create announcement");
      }
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <label className="label">Pinned</label>
          <input type="checkbox" checked={pinned} onChange={(e)=>setPinned(e.target.checked)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Body</label>
          <textarea className="input h-32" value={body} onChange={(e)=>setBody(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={create} disabled={!title || !body || loading}>
        {loading ? "Saving..." : "Create announcement"}
      </button>

      <div className="mt-6">
        <h3 className="h2 mb-2">Existing</h3>
        {!items.length ? <p className="text-gray-600">No announcements yet.</p> : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li key={a.id} className="border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-600">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <button className="btn btn-ghost" onClick={()=>remove(a.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
