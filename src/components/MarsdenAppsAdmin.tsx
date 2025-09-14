"use client";
import { useState, useEffect } from "react";
import * as Icons from "lucide-react";

type MarsdenApp = {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  order: number;
};

// Common icon options for the dropdown
const ICON_OPTIONS = [
  "Upload", "Download", "Settings", "Users", "Database", "Server", "Monitor", 
  "BarChart3", "PieChart", "TrendingUp", "Calculator", "FileText", "Folder",
  "Mail", "Phone", "Calendar", "Clock", "Shield", "Lock", "Key", "Globe",
  "Building", "CreditCard", "DollarSign", "Target", "Search", "Filter",
  "Edit", "Save", "Plus", "Minus", "Check", "X", "AlertCircle", "Info"
];

export function MarsdenAppsAdmin({ initialApps }: { initialApps: MarsdenApp[] }) {
  const [apps, setApps] = useState<MarsdenApp[]>(initialApps || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Square",
    url: "",
    order: 0
  });

  useEffect(() => {
    setApps(initialApps || []);
  }, [initialApps]);

  const resetForm = () => {
    setFormData({ name: "", description: "", icon: "Square", url: "", order: 0 });
  };

  const createApp = async () => {
    if (!formData.name.trim() || !formData.url.trim()) return;

    try {
      const res = await fetch("/api/marsden-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newApp = await res.json();
        setApps([...apps, newApp]);
        resetForm();
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Error creating app:", error);
    }
  };

  const startEdit = (app: MarsdenApp) => {
    setEditingApp(app.id);
    setFormData({
      name: app.name,
      description: app.description,
      icon: app.icon,
      url: app.url,
      order: app.order
    });
  };

  const saveEdit = async (appId: string) => {
    if (!formData.name.trim() || !formData.url.trim()) return;

    try {
      const res = await fetch(`/api/marsden-apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedApp = await res.json();
        setApps(apps.map(app => app.id === appId ? updatedApp : app));
        setEditingApp(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error updating app:", error);
    }
  };

  const deleteApp = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this app?")) return;

    try {
      const res = await fetch(`/api/marsden-apps/${appId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setApps(apps.filter(app => app.id !== appId));
      }
    } catch (error) {
      console.error("Error deleting app:", error);
    }
  };

  const IconPreview = ({ iconName }: { iconName: string }) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Square;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Add App Form */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-green-600 text-white px-4 py-2 rounded font-medium"
          >
            + Add New App
          </button>
        </div>

        {isAdding && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium mb-4">New Marsden App</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">App Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Client Uploader"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Drag-and-drop ingest"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <div className="flex gap-2">
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    className="flex-1 px-3 py-2 border rounded"
                  >
                    {ICON_OPTIONS.map(iconName => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                  <div className="w-10 h-10 border rounded flex items-center justify-center bg-blue-600 text-white">
                    <IconPreview iconName={formData.icon} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createApp}
                className="bg-green-600 text-white px-4 py-2 rounded"
                disabled={!formData.name.trim() || !formData.url.trim()}
              >
                Save App
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apps List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Current Apps ({apps.length})</h3>
        
        {apps.length === 0 ? (
          <p className="text-gray-600">No apps created yet.</p>
        ) : (
          <div className="space-y-3">
            {apps
              .sort((a, b) => a.order - b.order)
              .map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  {editingApp === app.id ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">App Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Description *</label>
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Icon</label>
                          <div className="flex gap-2">
                            <select
                              value={formData.icon}
                              onChange={(e) => setFormData({...formData, icon: e.target.value})}
                              className="flex-1 px-3 py-2 border rounded"
                            >
                              {ICON_OPTIONS.map(iconName => (
                                <option key={iconName} value={iconName}>
                                  {iconName}
                                </option>
                              ))}
                            </select>
                            <div className="w-10 h-10 border rounded flex items-center justify-center bg-blue-600 text-white">
                              <IconPreview iconName={formData.icon} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Order</label>
                          <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">URL *</label>
                          <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({...formData, url: e.target.value})}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(app.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingApp(null);
                            resetForm();
                          }}
                          className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                          <IconPreview iconName={app.icon} />
                        </div>
                        <div>
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-gray-600">{app.description}</p>
                          <p className="text-xs text-gray-500">Order: {app.order} • {app.url}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(app)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteApp(app.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}