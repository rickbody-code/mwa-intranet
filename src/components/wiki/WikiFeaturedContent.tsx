"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2 } from 'lucide-react';

interface FeaturedContent {
  introText: string;
  contentHTML: string;
}

interface WikiFeaturedContentProps {
  isAdmin: boolean;
}

export default function WikiFeaturedContent({ isAdmin }: WikiFeaturedContentProps) {
  const [content, setContent] = useState<FeaturedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/wiki/settings/featured');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error loading featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm p-6 relative">
      {isAdmin && (
        <Link
          href="/wiki/settings/featured"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
          title="Edit featured content"
        >
          <Edit2 className="w-4 h-4" />
        </Link>
      )}
      
      <p className="text-gray-700 mb-4 pr-10">{content.introText}</p>
      
      <div 
        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: content.contentHTML }}
      />
    </div>
  );
}
