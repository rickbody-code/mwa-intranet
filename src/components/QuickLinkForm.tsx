"use client";
import { useState } from "react";

export function QuickLinkForm({ existing }: { existing: any[] }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState(existing || []);

  async function add() {
    const res = await fetch("/api/links", { method: "POST", body: JSON.stringify({ label, url }) });
    if (res.ok) {
      const item = await res.json();
      setItems([item, ...items]);
      setLabel(""); setUrl("");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter(i => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Label</label>
          <input className="input" value={label} onChange={(e)=>setLabel(e.target.value)} />
        </div>
        <div>
          <label className="label">URL</label>
          <input className="input" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <button className="btn btn-primary" onClick={add} disabled={!label || !url}>Add link</button>

      <div className="mt-6">
        <h3 className="h2 mb-2">Existing</h3>
        {!items.length ? <p className="text-gray-600">No links yet.</p> : (
          <ul className="space-y-2">
            {items.map((l) => (
              <li key={l.id} className="border rounded-xl p-3 flex items-center justify-between">
                <div className="font-medium">{l.label}</div>
                <button className="btn btn-ghost" onClick={()=>remove(l.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
