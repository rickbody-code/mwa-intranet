"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, X, Clock, User, Eye, Tag, Link as LinkIcon, ArrowRight, Loader } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  path: string;
  status: string;
  snippet: string;
  searchRank?: number;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  internalLinksCount: number;
  author: {
    name: string;
    email: string;
  };
  type: string;
  tags?: Array<{ name: string; color?: string }>;
}

interface SearchResponse {
  pages: SearchResult[];
  query: string;
  total: number;
  searchTime: number;
  mode: string;
  tagSuggestions?: Array<{ name: string; count: number }>;
  relatedPages?: Array<{ id: string; title: string; slug: string; path: string }>;
  fallback?: boolean;
}

interface WikiSearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export default function WikiSearch({
  className = "",
  placeholder = "Search wiki pages, content, and tags...",
  showFilters = true,
  autoFocus = false,
  onResultClick
}: WikiSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchMode, setSearchMode] = useState('relevance');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
      setShowResults(false);
    }
  }, [debouncedQuery, selectedTags, statusFilter, searchMode, dateFilter]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        mode: searchMode,
        limit: '10'
      });

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (dateFilter.from) {
        params.append('dateFrom', dateFilter.from);
      }
      
      if (dateFilter.to) {
        params.append('dateTo', dateFilter.to);
      }

      const response = await fetch(`/api/wiki/search/enhanced?${params.toString()}`);
      
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data);
        setShowResults(true);
      } else {
        // Fallback to basic search
        const fallbackResponse = await fetch(`/api/wiki/search?${params.toString()}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setResults({
            ...fallbackData,
            searchTime: 0,
            mode: searchMode,
            fallback: true
          });
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, statusFilter, searchMode, dateFilter]);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    if (onResultClick) {
      onResultClick(result);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
    setSelectedTags([]);
    setStatusFilter('');
    setDateFilter({ from: '', to: '' });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const addTagFilter = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const removeTagFilter = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(!!results)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {loading && (
            <Loader className="h-4 w-4 text-gray-400 animate-spin mr-3" />
          )}
          {(query || selectedTags.length > 0) && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 mr-1 rounded ${
                showAdvancedFilters || selectedTags.length > 0 || statusFilter
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedTags.length > 0 || statusFilter) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
              <button
                onClick={() => removeTagFilter(tag)}
                className="ml-1 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {statusFilter && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {statusFilter}
              <button
                onClick={() => setStatusFilter('')}
                className="ml-1 hover:text-green-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Mode
              </label>
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Most Recent</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-1">
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && results && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Search Stats */}
          <div className="px-4 py-2 border-b bg-gray-50 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>
                {results.total} results for "{results.query}"
                {results.fallback && <span className="text-orange-600 ml-2">(basic search)</span>}
              </span>
              <span>{results.searchTime}ms</span>
            </div>
          </div>

          {/* Results List */}
          <div className="divide-y divide-gray-100">
            {results.pages.map((result, index) => (
              <Link
                key={result.id}
                href={`/wiki/pages/${result.id}`}
                onClick={() => handleResultClick(result)}
                className="block px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {result.snippet.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{result.author.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{result.viewCount}</span>
                      </div>
                      {result.internalLinksCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="w-3 h-3" />
                          <span>{result.internalLinksCount}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      result.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      result.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Tag Suggestions */}
          {results.tagSuggestions && results.tagSuggestions.length > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50">
              <div className="text-xs font-medium text-gray-700 mb-2">Suggested Tags:</div>
              <div className="flex flex-wrap gap-2">
                {results.tagSuggestions.map(tag => (
                  <button
                    key={tag.name}
                    onClick={() => addTagFilter(tag.name)}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name} ({tag.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Pages */}
          {results.relatedPages && results.relatedPages.length > 0 && (
            <div className="px-4 py-3 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Related Pages:</div>
              <div className="space-y-1">
                {results.relatedPages.map(page => (
                  <Link
                    key={page.id}
                    href={`/wiki/pages/${page.id}`}
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.pages.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pages found for "{results.query}"</p>
              <p className="text-sm mt-1">Try different keywords or check your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}