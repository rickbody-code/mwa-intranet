"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WikiEditor from './WikiEditor';
import SimpleCollaborativeEditor from './SimpleCollaborativeEditor';

// Import the markdown conversion function from WikiEditor
function convertToMarkdown(doc: any): string {
  if (!doc || !doc.content) return '';
  
  return doc.content.map((node: any) => {
    switch (node.type) {
      case 'heading':
        const level = '#'.repeat(node.attrs?.level || 1);
        const text = node.content?.[0]?.text || '';
        return `${level} ${text}\n\n`;
      case 'paragraph':
        const paragraphText = node.content?.map((inline: any) => {
          if (inline.type === 'text') {
            let text = inline.text || '';
            if (inline.marks) {
              inline.marks.forEach((mark: any) => {
                switch (mark.type) {
                  case 'bold':
                    text = `**${text}**`;
                    break;
                  case 'italic':
                    text = `*${text}*`;
                    break;
                  case 'code':
                    text = `\`${text}\``;
                    break;
                }
              });
            }
            return text;
          }
          return inline.text || '';
        }).join('') || '';
        return `${paragraphText}\n\n`;
      case 'bulletList':
        return node.content?.map((item: any) => {
          const itemText = item.content?.[0]?.content?.[0]?.text || '';
          return `- ${itemText}`;
        }).join('\n') + '\n\n';
      case 'orderedList':
        return node.content?.map((item: any, index: number) => {
          const itemText = item.content?.[0]?.content?.[0]?.text || '';
          return `${index + 1}. ${itemText}`;
        }).join('\n') + '\n\n';
      case 'blockquote':
        const quoteText = node.content?.[0]?.content?.[0]?.text || '';
        return `> ${quoteText}\n\n`;
      case 'codeBlock':
        const codeText = node.content?.[0]?.text || '';
        return `\`\`\`\n${codeText}\n\`\`\`\n\n`;
      default:
        return '';
    }
  }).join('');
}
// Using basic HTML elements to avoid UI component dependencies
import { X, Plus, Save, Eye } from 'lucide-react';

interface WikiPageFormProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: any;
    status?: 'DRAFT' | 'PUBLISHED';
    tags?: string[];
    parentId?: string;
  };
  mode?: 'create' | 'edit';
  onSave?: (data: any) => Promise<void>;
  onPreview?: (data: any) => void;
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-sm rounded-md">
            {tag}
            <X 
              className="w-3 h-3 cursor-pointer hover:text-red-600" 
              onClick={() => handleRemoveTag(tag)}
            />
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAddTag}
        placeholder="Add tags (press Enter or comma to add)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function WikiPageForm({
  initialData,
  mode = 'create',
  onSave,
  onPreview
}: WikiPageFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || null,
    status: initialData?.status || 'DRAFT' as const,
    tags: initialData?.tags || [],
    parentId: initialData?.parentId || '',
    changeNote: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [useCollaborativeEditor, setUseCollaborativeEditor] = useState(false);

  const handleContentChange = useCallback((content: any) => {
    setFormData(prev => ({ ...prev, content }));
  }, []);

  const handleSave = useCallback(async (content: any, markdown: string) => {
    if (!formData.title.trim()) {
      alert('Please enter a page title');
      return;
    }

    setIsSaving(true);
    try {
      const pageData = {
        title: formData.title,
        content: content,
        contentMarkdown: markdown,
        status: formData.status,
        tags: formData.tags,
        parentId: formData.parentId || undefined,
        changeNote: formData.changeNote || (mode === 'create' ? 'Initial version' : 'Updated content')
      };

      if (onSave) {
        await onSave(pageData);
      } else {
        // Default save behavior - API call
        const url = mode === 'create' 
          ? '/api/wiki/pages' 
          : `/api/wiki/pages/${initialData?.id}`;
        
        const method = mode === 'create' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Save failed');
        }

        const result = await response.json();
        
        // Redirect to the page after saving
        router.push(`/wiki/pages/${result.slug || result.id}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [formData, mode, onSave, initialData?.id, router]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview({
        ...formData,
        content: formData.content
      });
    } else {
      setIsPreview(!isPreview);
    }
  }, [formData, onPreview, isPreview]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create New Page' : 'Edit Page'}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {!isPreview ? (
        <>
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter page title..."
                  className="w-full px-3 py-2 text-lg font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  {mode === 'edit' && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Real-time collaboration:</label>
                      <input
                        type="checkbox"
                        checked={useCollaborativeEditor}
                        onChange={(e) => setUseCollaborativeEditor(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                
                {useCollaborativeEditor && mode === 'edit' ? (
                  <SimpleCollaborativeEditor
                    pageId={initialData?.id || 'new-page'}
                    initialContent={formData.content}
                    onChange={handleContentChange}
                    editable={true}
                    className="mt-2"
                  />
                ) : (
                  <WikiEditor
                    content={formData.content}
                    onChange={handleContentChange}
                    onSave={handleSave}
                    placeholder="Start writing your wiki page..."
                    className="mt-2"
                    pageId={initialData?.id}
                  />
                )}
              </div>

              {mode === 'edit' && (
                <div>
                  <label htmlFor="changeNote" className="block text-sm font-medium text-gray-700 mb-1">
                    Change Note
                  </label>
                  <input
                    id="changeNote"
                    type="text"
                    value={formData.changeNote}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, changeNote: e.target.value }))}
                    placeholder="Describe what changed in this version..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-3">Publish Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select 
                      id="status"
                      value={formData.status} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value as 'DRAFT' | 'PUBLISHED' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Convert content to markdown before saving
                        // Handle empty content by providing minimal valid content
                        const contentToSave = formData.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
                        const markdown = convertToMarkdown(contentToSave);
                        handleSave(contentToSave, markdown);
                      }}
                      disabled={isSaving || !formData.title.trim()}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Page'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Tags</h3>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                />
              </div>

              {/* Organization */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Organization</h3>
                <div>
                  <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Page
                  </label>
                  <input
                    id="parent"
                    type="text"
                    value={formData.parentId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    placeholder="Parent page ID (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for top-level page
                  </p>
                </div>
              </div>

              {/* Help */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <h3 className="font-semibold mb-2 text-blue-800">Tips</h3>
                <ul className="text-sm space-y-1 text-blue-700">
                  <li>• Use @mentions to reference other pages</li>
                  <li>• Add tags to categorize your content</li>
                  <li>• Upload images and files directly in the editor</li>
                  <li>• Save as draft to review before publishing</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Preview Mode */
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4">{formData.title || 'Untitled Page'}</h2>
          <div className="prose prose-lg max-w-none">
            {formData.content ? (
              <WikiEditor
                content={formData.content}
                readOnly={true}
                className="bg-white"
              />
            ) : (
              <p className="text-gray-500">No content yet. Switch to edit mode to add content.</p>
            )}
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-2">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="inline-block px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}