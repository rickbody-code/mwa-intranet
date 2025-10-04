"use client";

import React, { useState } from 'react';
import { Save, Plus, X, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  link: string;
}

export default function FeaturedContentEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [introText, setIntroText] = useState(
    "Welcome to the MWA Knowledge Base! Get started with these key pages:"
  );
  
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([
    {
      id: '1',
      title: 'Getting Started',
      description: 'Learn how to create and edit wiki pages',
      link: '/wiki/create'
    },
    {
      id: '2',
      title: 'Browse All Pages',
      description: 'Explore all available wiki content',
      link: '/wiki'
    }
  ]);

  const addItem = () => {
    const newItem: FeaturedItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      link: ''
    };
    setFeaturedItems([...featuredItems, newItem]);
  };

  const removeItem = (id: string) => {
    setFeaturedItems(featuredItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof FeaturedItem, value: string) => {
    setFeaturedItems(featuredItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // For now, just show success and redirect back
    // In a real implementation, you'd save to database/localStorage
    setTimeout(() => {
      setSaving(false);
      alert('Featured content saved successfully!');
      router.push('/wiki');
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Introduction Text</h2>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Enter introduction text..."
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Featured Items</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {featuredItems.map((item, index) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 rounded-lg relative"
            >
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove item"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Getting Started Guide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link
                  </label>
                  <input
                    type="text"
                    value={item.link}
                    onChange={(e) => updateItem(item.id, 'link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/wiki/pages/your-page-slug"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of what this page contains"
                  />
                </div>
              </div>
            </div>
          ))}

          {featuredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No featured items yet. Click "Add Item" to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Changes will appear on the wiki homepage after saving.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/wiki')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
