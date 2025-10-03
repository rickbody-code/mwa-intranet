"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, User, Eye, RotateCcw, GitCompare, AlertCircle } from 'lucide-react';

interface Version {
  id: string;
  title: string;
  changeNote: string;
  isMinorEdit: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface VersionHistoryProps {
  pageId: string;
  currentVersionId?: string;
  viewedVersionId?: string;
  className?: string;
}

export default function VersionHistory({ 
  pageId, 
  currentVersionId, 
  viewedVersionId,
  className = "" 
}: VersionHistoryProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [reverting, setReverting] = useState<string>('');

  useEffect(() => {
    loadVersions();
  }, [pageId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/wiki/pages/${pageId}/versions`);
      if (!response.ok) {
        throw new Error('Failed to load version history');
      }
      
      const data = await response.json();
      setVersions(data);
    } catch (err) {
      console.error('Error loading versions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedVersions(prev => {
        if (prev.length >= 2) {
          return [prev[1], versionId]; // Replace oldest with new selection
        }
        return [...prev, versionId];
      });
    } else {
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      const [from, to] = selectedVersions.sort((a, b) => {
        const aIndex = versions.findIndex(v => v.id === a);
        const bIndex = versions.findIndex(v => v.id === b);
        return bIndex - aIndex; // Older first (from), newer second (to)
      });
      window.open(`/wiki/diff/${pageId}?from=${from}&to=${to}`, '_blank');
    }
  };

  const handleRevertToVersion = async (versionId: string, changeNote?: string) => {
    try {
      setReverting(versionId);
      
      const response = await fetch(`/api/wiki/pages/${pageId}/versions/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionId,
          changeNote: changeNote || `Reverted to version from ${new Date().toISOString()}`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to revert version');
      }

      // Refresh page to show reverted content
      window.location.reload();
      
    } catch (err) {
      console.error('Error reverting version:', err);
      alert(err instanceof Error ? err.message : 'Failed to revert version');
    } finally {
      setReverting('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadVersions}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Version History ({versions.length} versions)
        </h3>
        
        {selectedVersions.length === 2 && (
          <button
            onClick={handleCompareVersions}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Selected</span>
          </button>
        )}
      </div>

      {selectedVersions.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          {selectedVersions.length === 1 ? 
            'Select one more version to compare' : 
            'Click "Compare Selected" to view differences'
          }
        </div>
      )}

      <div className="space-y-2">
        {versions.map((version, index) => {
          const isCurrent = version.id === currentVersionId;
          const isViewed = version.id === viewedVersionId;
          const isSelected = selectedVersions.includes(version.id);
          
          return (
            <div 
              key={version.id}
              className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                isViewed ? 'bg-green-50 border-green-200' : 
                isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleVersionSelect(version.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    #{versions.length - index}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Current
                    </span>
                  )}
                  {version.isMinorEdit && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Minor
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mt-1">
                  {version.changeNote || 'No change note'}
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(version.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{version.createdBy.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/wiki/pages/${pageId}?version=${version.id}`)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View this version"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {!isCurrent && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to revert to this version? This will create a new version with the content from this point.')) {
                        handleRevertToVersion(version.id);
                      }
                    }}
                    disabled={reverting === version.id}
                    className="p-1 text-gray-400 hover:text-orange-600 disabled:opacity-50"
                    title="Revert to this version"
                  >
                    {reverting === version.id ? (
                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No version history available</p>
        </div>
      )}
    </div>
  );
}