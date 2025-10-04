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
      <div className="knowledge-base">
        <div className="kb-header">
          <div className="kb-title">
            Knowledge Base
          </div>
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
    <div className="knowledge-base">
      {/* Header */}
      <div className="kb-header">
        <div className="kb-title">
          Knowledge Base
        </div>
        {session && (
          <Link 
            href="/wiki/create"
            className="new-page-btn"
          >
            <Plus className="w-3 h-3" />
            New
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search wiki pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-box"
        />
        
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

      {/* Popular & Recent Content */}
      {stats && (
        <div className="space-y-4">
          {/* Popular Pages */}
          <div className="kb-section">
            <div className="kb-section-title">
              <TrendingUp className="w-4 h-4" />
              Popular Pages
            </div>
            <div className="page-list">
              {stats.popularPages.slice(0, 3).map((page) => (
                <Link
                  key={page.id}
                  href={page.safeHref || `/wiki/pages/${page.id}`}
                  className="page-item block"
                >
                  <div className="page-title">
                    {page.title}
                  </div>
                  <div className="page-meta flex items-center justify-between">
                    <span className="truncate flex-1 mr-2">
                      {page.summary || 'No summary available'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {page.viewCount}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Pages */}
          <div className="kb-section">
            <div className="kb-section-title">
              <Clock className="w-4 h-4" />
              Recently Updated
            </div>
            <div className="page-list">
              {stats.recentPages.slice(0, 3).map((page) => (
                <Link
                  key={page.id}
                  href={page.safeHref || `/wiki/pages/${page.id}`}
                  className="page-item block"
                >
                  <div className="page-title">
                    {page.title}
                  </div>
                  <div className="page-meta flex items-center justify-between">
                    <span>by {page.authorName || 'Unknown'}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Browse All Link */}
          <Link
            href="/wiki"
            className="browse-all"
          >
            <Users className="w-4 h-4" />
            Browse All Wiki Pages
          </Link>
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
              className="new-page-btn"
              style={{ display: 'inline-flex' }}
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
