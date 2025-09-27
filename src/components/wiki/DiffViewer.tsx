"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, GitCompare, ArrowLeft, AlertCircle } from 'lucide-react';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

interface VersionInfo {
  id: string;
  title: string;
  changeNote: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface DiffStats {
  linesAdded: number;
  linesRemoved: number;
  linesUnchanged: number;
  totalChanges: number;
}

interface DiffData {
  fromVersion: VersionInfo;
  toVersion: VersionInfo;
  diff: DiffLine[];
  stats: DiffStats;
}

interface DiffViewerProps {
  pageId: string;
  fromVersionId: string;
  toVersionId: string;
  className?: string;
}

export default function DiffViewer({ 
  pageId, 
  fromVersionId, 
  toVersionId,
  className = "" 
}: DiffViewerProps) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  useEffect(() => {
    loadDiff();
  }, [pageId, fromVersionId, toVersionId]);

  const loadDiff = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/wiki/pages/${pageId}/versions/diff?from=${fromVersionId}&to=${toVersionId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load version diff');
      }
      
      const data = await response.json();
      setDiffData(data);
    } catch (err) {
      console.error('Error loading diff:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diff');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
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
          onClick={loadDiff}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!diffData) {
    return null;
  }

  const { fromVersion, toVersion, diff, stats } = diffData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <GitCompare className="w-6 h-6" />
            <span>Version Comparison</span>
          </h1>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'unified' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'split' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Split
            </button>
          </div>
        </div>

        {/* Version Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">From Version</h3>
            <div className="text-sm space-y-1">
              <div><strong>Title:</strong> {fromVersion.title}</div>
              <div><strong>Author:</strong> {fromVersion.createdBy.name}</div>
              <div><strong>Date:</strong> {formatDate(fromVersion.createdAt)}</div>
              <div><strong>Note:</strong> {fromVersion.changeNote || 'No change note'}</div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">To Version</h3>
            <div className="text-sm space-y-1">
              <div><strong>Title:</strong> {toVersion.title}</div>
              <div><strong>Author:</strong> {toVersion.createdBy.name}</div>
              <div><strong>Date:</strong> {formatDate(toVersion.createdAt)}</div>
              <div><strong>Note:</strong> {toVersion.changeNote || 'No change note'}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 mt-4 text-sm">
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span>{stats.linesAdded} additions</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-red-500 rounded"></span>
            <span>{stats.linesRemoved} deletions</span>
          </span>
          <span className="text-gray-600">
            {stats.totalChanges} changes in {diff.length} lines
          </span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {viewMode === 'unified' ? (
          <div className="divide-y">
            {diff.map((line, index) => (
              <div 
                key={index}
                className={`flex ${
                  line.type === 'added' ? 'bg-green-50' :
                  line.type === 'removed' ? 'bg-red-50' : 'bg-white'
                }`}
              >
                {/* Line numbers */}
                <div className="flex">
                  <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r bg-gray-50">
                    {line.oldLineNum || ''}
                  </div>
                  <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r bg-gray-50">
                    {line.newLineNum || ''}
                  </div>
                </div>
                
                {/* Change indicator */}
                <div className="w-8 px-2 py-1 text-center text-sm font-mono">
                  {line.type === 'added' ? '+' : 
                   line.type === 'removed' ? '-' : ' '}
                </div>
                
                {/* Content */}
                <div className="flex-1 px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all">
                  {line.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Split view */
          <div className="grid grid-cols-2 divide-x">
            <div className="divide-y">
              <div className="bg-red-100 px-4 py-2 font-medium text-red-800">
                {fromVersion.title}
              </div>
              {diff.filter(line => line.type !== 'added').map((line, index) => (
                <div key={`old-${index}`} className={`flex ${
                  line.type === 'removed' ? 'bg-red-50' : 'bg-white'
                }`}>
                  <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r bg-gray-50">
                    {line.oldLineNum || ''}
                  </div>
                  <div className="flex-1 px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all">
                    {line.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="divide-y">
              <div className="bg-green-100 px-4 py-2 font-medium text-green-800">
                {toVersion.title}
              </div>
              {diff.filter(line => line.type !== 'removed').map((line, index) => (
                <div key={`new-${index}`} className={`flex ${
                  line.type === 'added' ? 'bg-green-50' : 'bg-white'
                }`}>
                  <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r bg-gray-50">
                    {line.newLineNum || ''}
                  </div>
                  <div className="flex-1 px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all">
                    {line.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {diff.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No differences found between these versions</p>
        </div>
      )}
    </div>
  );
}