"use client";

import React from 'react';
import { Edit2 } from 'lucide-react';
import Link from 'next/link';

interface WikiFeaturedContentProps {
  isAdmin: boolean;
}

export default function WikiFeaturedContent({ isAdmin }: WikiFeaturedContentProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 relative">
      {isAdmin && (
        <Link
          href="/wiki/settings/featured"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Edit featured content"
        >
          <Edit2 className="w-4 h-4" />
        </Link>
      )}
      
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Featured Pages
      </h2>
      
      <div className="text-gray-600 text-sm">
        <p className="mb-4">
          Welcome to the MWA Knowledge Base! Get started with these key pages:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/wiki/create"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Getting Started</h3>
            <p className="text-sm text-gray-600">Learn how to create and edit wiki pages</p>
          </Link>
          
          <Link
            href="/wiki"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Browse All Pages</h3>
            <p className="text-sm text-gray-600">Explore all available wiki content</p>
          </Link>
        </div>
        
        {isAdmin && (
          <p className="mt-4 text-xs text-gray-500 italic">
            Click the edit icon above to customize this featured content section.
          </p>
        )}
      </div>
    </div>
  );
}
