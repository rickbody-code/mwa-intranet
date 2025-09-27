"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  User,
  FileText,
  Plus,
  Edit,
  RotateCcw,
  Upload,
  Trash2,
  Eye,
  Archive,
  Tag,
  X,
  Settings,
  ChevronDown,
  ChevronRight,
  Filter
} from "lucide-react";

interface ActivityLog {
  id: string;
  type: string;
  data: any;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  };
  page: {
    id: string;
    title: string;
    slug: string;
    path: string;
    safeHref: string;
  } | null;
  version: {
    id: string;
    title: string;
    changeNote: string | null;
  } | null;
}

interface ActivityLogProps {
  pageId?: string;
  showPageInfo?: boolean;
  limit?: number;
  className?: string;
}

const activityIcons: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit,
  RESTORE: RotateCcw,
  UPLOAD: Upload,
  DELETE: Trash2,
  PUBLISH: Eye,
  ARCHIVE: Archive,
  TAG_ADD: Tag,
  TAG_REMOVE: X,
  PERMISSION_CHANGE: Settings
};

const activityColors: Record<string, string> = {
  CREATE: "text-green-600 bg-green-50",
  UPDATE: "text-blue-600 bg-blue-50", 
  RESTORE: "text-yellow-600 bg-yellow-50",
  UPLOAD: "text-purple-600 bg-purple-50",
  DELETE: "text-red-600 bg-red-50",
  PUBLISH: "text-indigo-600 bg-indigo-50",
  ARCHIVE: "text-gray-600 bg-gray-50",
  TAG_ADD: "text-cyan-600 bg-cyan-50",
  TAG_REMOVE: "text-orange-600 bg-orange-50",
  PERMISSION_CHANGE: "text-pink-600 bg-pink-50"
};

const activityLabels: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  RESTORE: "Restored",
  UPLOAD: "Uploaded",
  DELETE: "Deleted",
  PUBLISH: "Published",
  ARCHIVE: "Archived",
  TAG_ADD: "Tagged",
  TAG_REMOVE: "Untagged",
  PERMISSION_CHANGE: "Permission Changed"
};

export default function ActivityLog({ 
  pageId, 
  showPageInfo = true, 
  limit = 20,
  className = "" 
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchActivities();
  }, [pageId, limit, filterType]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (pageId) params.append('pageId', pageId);
      if (filterType) params.append('type', filterType);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/wiki/activity?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatActivityDescription = (activity: ActivityLog) => {
    const { type, data, page, version, actor } = activity;
    
    switch (type) {
      case 'CREATE':
        return `Created page "${data?.title || page?.title || 'Unknown'}"`;
      case 'UPDATE':
        return `Updated page${data?.isMinorEdit ? ' (minor edit)' : ''}`;
      case 'RESTORE':
        return `Restored page to previous version`;
      case 'UPLOAD':
        return `Uploaded file to page`;
      case 'DELETE':
        return `Deleted page "${data?.title || page?.title || 'Unknown'}"`;
      case 'PUBLISH':
        return `Published page`;
      case 'ARCHIVE':
        return `Archived page`;
      case 'TAG_ADD':
        return `Added tags to page`;
      case 'TAG_REMOVE':
        return `Removed tags from page`;
      case 'PERMISSION_CHANGE':
        return `Changed permissions`;
      default:
        return `Performed action: ${type.toLowerCase()}`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600">Failed to load activity logs: {error}</p>
        <button 
          onClick={fetchActivities}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1"
        >
          <option value="">All activities</option>
          <option value="CREATE">Created</option>
          <option value="UPDATE">Updated</option>
          <option value="RESTORE">Restored</option>
          <option value="UPLOAD">Uploaded</option>
          <option value="DELETE">Deleted</option>
          <option value="PUBLISH">Published</option>
          <option value="ARCHIVE">Archived</option>
          <option value="TAG_ADD">Tagged</option>
          <option value="TAG_REMOVE">Untagged</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No activity found</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons] || FileText;
            const colorClass = activityColors[activity.type as keyof typeof activityColors] || "text-gray-600 bg-gray-50";
            const isExpanded = expandedItems.has(activity.id);

            return (
              <div key={activity.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Activity Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.actor.name || activity.actor.email}</span>
                            {' '}
                            <span className="text-gray-600">{formatActivityDescription(activity)}</span>
                          </p>
                          
                          {showPageInfo && activity.page && (
                            <div className="mt-1">
                              <Link 
                                href={activity.page.safeHref}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {activity.page.title}
                              </Link>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(activity.createdAt)}</span>
                          {activity.data && Object.keys(activity.data).length > 0 && (
                            <button
                              onClick={() => toggleExpanded(activity.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && activity.data && (
                    <div className="mt-3 pl-11 text-xs">
                      <div className="bg-gray-50 rounded p-3">
                        <h4 className="font-medium text-gray-700 mb-2">Activity Details</h4>
                        <pre className="text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(activity.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}