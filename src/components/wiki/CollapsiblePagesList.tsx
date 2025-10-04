"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, List, User, Calendar, Eye, Tag, BookOpen, Plus } from 'lucide-react';
import Link from 'next/link';

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  path: string;
  summary?: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color?: string | null;
  }>;
  versionsCount: number;
}

interface CollapsiblePagesListProps {
  pages: WikiPage[];
}

export default function CollapsiblePagesList({ pages }: CollapsiblePagesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <List className="w-5 h-5 text-gray-600" />
          All Wiki Pages
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({pages.length})
          </span>
        </h2>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-600" />
        )}
      </button>
      
      {isExpanded && (
        <>
          {pages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pages.map((page) => (
                <div key={page.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/wiki/pages/${page.slug || page.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {page.title}
                      </Link>
                      
                      {page.summary && (
                        <p className="text-gray-600 mt-2 line-clamp-2">{page.summary}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {page.author.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(page.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {page.viewCount} views
                        </div>
                        {page.versionsCount > 1 && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {page.versionsCount} versions
                          </div>
                        )}
                      </div>
                      
                      {page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {page.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                                color: tag.color || '#6b7280'
                              }}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800'
                          : page.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No wiki pages yet</h3>
              <p className="mb-4">Get started by creating your first wiki page.</p>
              <Link
                href="/wiki/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Page
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
