"use client";

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough, 
  Code,
  Heading1,
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CheckSquare,
  Eraser
} from 'lucide-react';
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

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'hover:bg-gray-100 text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
        <p className="text-gray-500">Initializing editor...</p>
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
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-3 flex flex-wrap gap-1 bg-gray-50">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="Clear Formatting"
            >
              <Eraser className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Text Color */}
            <div className="relative inline-block">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Text Color"
              />
            </div>

            {/* Highlight Color */}
            <div className="relative inline-block">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                title="Highlight Color"
              />
            </div>

            {/* Font Family */}
            <select
              onChange={(e) => {
                if (e.target.value === 'unset') {
                  editor.chain().focus().unsetFontFamily().run();
                } else {
                  editor.chain().focus().setFontFamily(e.target.value).run();
                }
              }}
              value={editor.getAttributes('textStyle').fontFamily || 'unset'}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Font Family"
            >
              <option value="unset">Default</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
            </select>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title="Task List (Checkboxes)"
            >
              <CheckSquare className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Insert elements */}
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('Enter link URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              isActive={editor.isActive('link')}
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('Enter image URL:');
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              title="Insert Image from URL"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }}
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* History */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Editor Content */}
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
