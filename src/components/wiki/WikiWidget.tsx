"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  BookOpen, 
  Plus, 
  Search, 
  TrendingUp, 
  Clock, 
  Users, 
  FileText,
  Eye,
  Calendar
} from "lucide-react";

interface WikiPage {
  id: string;
  title: string;
  slug: string;
  path: string;
  safeHref?: string;
  summary?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorEmail?: string;
  tagsCount?: number;
}

interface WikiStats {
  totalPages: number;
  totalViews: number;
  recentPages: WikiPage[];
  popularPages: WikiPage[];
  recentActivity: Array<{
    type: 'created' | 'updated' | 'viewed';
    page: WikiPage;
    timestamp: string;
  }>;
}

export function WikiWidget() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<WikiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WikiPage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchWikiStats();
  }, []);

  const fetchWikiStats = async () => {
    try {
      const response = await fetch('/api/wiki/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch wiki stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/wiki/search/enhanced?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.pages || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Wiki Knowledge Base</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Wiki Knowledge Base</h3>
        </div>
        {session && (
          <Link 
            href="/wiki/create"
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Page
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search wiki pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Search Results */}
        {(searchQuery.trim() && (isSearching || searchResults.length > 0)) && (
          <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm">
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                {searchResults.map((page) => (
                  <Link
                    key={page.id}
                    href={page.safeHref || `/wiki/pages/${page.id}`}
                    className="block p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {page.title}
                    </div>
                    {page.summary && (
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {page.summary}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-3 text-sm text-gray-500">No pages found</div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Pages</span>
            </div>
            <div className="text-lg font-semibold text-blue-900">{stats.totalPages}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Views</span>
            </div>
            <div className="text-lg font-semibold text-green-900">{stats.totalViews.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Popular & Recent Content */}
      {stats && (
        <div className="space-y-4">
          {/* Popular Pages */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <h4 className="text-sm font-semibold text-gray-700">Popular Pages</h4>
            </div>
            <div className="space-y-2">
              {stats.popularPages.slice(0, 3).map((page) => (
                <Link
                  key={page.id}
                  href={page.safeHref || `/wiki/pages/${page.id}`}
                  className="block p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {page.title}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                      {page.summary || 'No summary available'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye className="w-3 h-3" />
                      {page.viewCount}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Pages */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-700">Recently Updated</h4>
            </div>
            <div className="space-y-2">
              {stats.recentPages.slice(0, 3).map((page) => (
                <Link
                  key={page.id}
                  href={page.safeHref || `/wiki/pages/${page.id}`}
                  className="block p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {page.title}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500">
                      by {page.authorName || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Browse All Link */}
          <div className="pt-3 border-t border-gray-200">
            <Link
              href="/wiki"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Users className="w-4 h-4" />
              Browse All Wiki Pages
            </Link>
          </div>
        </div>
      )}

      {/* No Content State */}
      {!stats?.totalPages && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm mb-3">No wiki pages yet</p>
          {session && (
            <Link
              href="/wiki/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Page
            </Link>
          )}
        </div>
      )}
    </div>
  );
}