"use client";

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

export default function FeaturedContentEditor() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      FontFamily,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none px-4 py-3',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/wiki/settings/featured');
        const data = await response.json();
        
        setIntroText(data.introText || "");
        
        if (editor && data.contentHTML) {
          editor.commands.setContent(data.contentHTML);
        }
      } catch (error) {
        console.error('Error loading featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [editor]);

  const handleSave = async () => {
    if (!editor) return;

    setSaving(true);
    
    try {
      const contentHTML = editor.getHTML();
      
      const response = await fetch('/api/wiki/settings/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          introText,
          contentHTML,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      router.push('/wiki');
      router.refresh();
    } catch (error) {
      console.error('Error saving featured content:', error);
      alert('Failed to save featured content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Introduction Text</h2>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Enter introduction text..."
        />
      </div>

      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Content (WYSIWYG)</h2>
        <div className="border border-gray-300 rounded-md">
          <EditorContent editor={editor} />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Use the editor to format your featured content. You can add links, bold text, lists, and more.
        </p>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Changes will appear on the wiki homepage after saving.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/wiki')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
