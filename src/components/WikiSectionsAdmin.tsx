"use client";
import { useState, useEffect } from "react";
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

const iconOptions = [
  "FileText", "Scale", "BarChart3", "Package", "Wrench", "Building2",
  "Users", "Target", "Calendar", "Book", "Lightbulb", "Shield"
];

export function WikiSectionsAdmin({ initialSections }: { initialSections: WikiSection[] }) {
  const [sections, setSections] = useState<WikiSection[]>(initialSections || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "FileText",
    linkText: "View More →",
    linkUrl: "",
    order: 0
  });

  useEffect(() => {
    setSections(initialSections || []);
  }, [initialSections]);

  const resetForm = () => {
    setFormData({ 
      title: "", 
      description: "", 
      icon: "FileText", 
      linkText: "View More →", 
      linkUrl: "", 
      order: 0 
    });
  };

  const createSection = async () => {
    if (!formData.title.trim() || !formData.linkUrl.trim()) return;

    try {
      const res = await fetch("/api/wiki-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newSection = await res.json();
        setSections([...sections, newSection]);
        resetForm();
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const startEdit = (section: WikiSection) => {
    setEditingSection(section.id);
    setFormData({
      title: section.title,
      description: section.description,
      icon: section.icon,
      linkText: section.linkText,
      linkUrl: section.linkUrl,
      order: section.order
    });
  };

  const saveEdit = async (sectionId: string) => {
    if (!formData.title.trim() || !formData.linkUrl.trim()) return;

    try {
      const res = await fetch(`/api/wiki-sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedSection = await res.json();
        setSections(sections.map(s => s.id === sectionId ? updatedSection : s));
        setEditingSection(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this wiki section?")) return;

    try {
      const res = await fetch(`/api/wiki-sections/${sectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSections(sections.filter(s => s.id !== sectionId));
      }
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {sections.length} wiki {sections.length === 1 ? "section" : "sections"}
        </p>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Wiki Section
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded border">
          <h3 className="font-semibold mb-3">Add New Wiki Section</h3>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Title (e.g., Compliance & Regulation)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border rounded px-3 py-2"
              rows={2}
            />
            <input
              type="text"
              placeholder="Link Text (e.g., Access Compliance →)"
              value={formData.linkText}
              onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Link URL"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="border rounded px-3 py-2"
            >
              {iconOptions.map(icon => {
                const IconComponent = (Icons as any)[icon];
                return (
                  <option key={icon} value={icon}>{icon}</option>
                );
              })}
            </select>
            <input
              type="number"
              placeholder="Order"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={createSection}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Section
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedSections.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No wiki sections yet</p>
        ) : (
          <div className="space-y-2">
            {sortedSections.map((section) => {
              const IconComponent = (Icons as any)[section.icon] || Icons.FileText;
              
              return (
                <div key={section.id} className="border rounded p-4">
                  {editingSection === section.id ? (
                    <div className="grid gap-3">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="border rounded px-3 py-2"
                      />
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border rounded px-3 py-2"
                        rows={2}
                      />
                      <input
                        type="text"
                        value={formData.linkText}
                        onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                        className="border rounded px-3 py-2"
                      />
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="border rounded px-3 py-2"
                      >
                        {iconOptions.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="border rounded px-3 py-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(section.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSection(null);
                            resetForm();
                          }}
                          className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{section.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{section.description}</div>
                          <div className="text-sm text-blue-600 mt-1">{section.linkText}</div>
                          <div className="text-xs text-gray-400 mt-1">URL: {section.linkUrl}</div>
                          <div className="text-xs text-gray-400">Order: {section.order}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(section)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
