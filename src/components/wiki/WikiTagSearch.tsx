"use client";

import React, { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import Link from 'next/link';

interface WikiTag {
  id: string;
  name: string;
  color?: string | null;
  pageCount: number;
}

interface WikiTagSearchProps {
  tags: WikiTag[];
}

export default function WikiTagSearch({ tags }: WikiTagSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<WikiTag[]>(tags);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(tags);
    }
  }, [searchQuery, tags]);

  return (
    <div className="relative">
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchQuery && filteredTags.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            {filteredTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/wiki?tag=${encodeURIComponent(tag.name)}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                      color: tag.color || '#6b7280'
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {tag.pageCount} {tag.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 10).map((tag) => (
            <Link
              key={tag.id}
              href={`/wiki?tag=${encodeURIComponent(tag.name)}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                color: tag.color || '#6b7280'
              }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
              <span className="ml-2 text-xs opacity-75">({tag.pageCount})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
