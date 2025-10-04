"use client";

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FeaturedContentEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/wiki/settings/featured');
        const data = await response.json();
        
        setIntroText(data.introText || "");
        setHtmlContent(data.contentHTML || "");
      } catch (error) {
        console.error('Error loading featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/wiki/settings/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          introText,
          contentHTML: htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      router.push('/wiki');
      router.refresh();
    } catch (error) {
      console.error('Error saving featured content:', error);
      alert('Failed to save featured content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Introduction Text</h2>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter introduction text..."
        />
      </div>

      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">HTML Content</h2>
        <p className="text-sm text-gray-600 mb-3">
          Paste your custom HTML below. It will be rendered exactly as-is on the wiki homepage.
        </p>
        
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={20}
          placeholder="<div>Your HTML here...</div>"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          You can use any HTML, CSS classes, inline styles, etc. Your code will be preserved exactly as written.
        </p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
