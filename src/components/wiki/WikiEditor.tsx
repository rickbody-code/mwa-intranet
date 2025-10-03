"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import Typography from '@tiptap/extension-typography';

import { 
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
  Palette,
  Highlighter,
  Type,
  Paintbrush,
  Upload,
  Save,
  Eye
} from 'lucide-react';

// Markdown conversion function for the editor
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

interface WikiEditorProps {
  content?: any; // Can be string or TipTap JSON object
  onChange?: (content: any) => void;
  onSave?: (content: any, markdown: string) => Promise<void>;
  onPreview?: () => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  pageId?: string; // For associating uploads to pages
}

export default function WikiEditor({
  content,
  onChange,
  onSave,
  onPreview,
  placeholder = "Start writing your wiki page...",
  className = "",
  readOnly = false,
  pageId
}: WikiEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<any>(null);
  const [formatPainterActive, setFormatPainterActive] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-blue-100 text-blue-800 px-1 rounded',
        },
        suggestion: {
          items: ({ query }) => {
            // TODO: Implement page/user mention search
            return [
              'HomePage',
              'Documentation',
              'TeamMembers',
              'Projects'
            ].filter(item => item.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionList(props);
                popup = document.createElement('div');
                popup.className = 'bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto z-50';
                document.body.appendChild(popup);
              },
              onUpdate(props: any) {
                component.updateProps(props);
              },
              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup.remove();
                  return true;
                }
                return component.onKeyDown(props);
              },
              onExit() {
                popup.remove();
              },
            };
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Typography,
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = editor.getJSON();
        onChange(json);
      }
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    
    setIsSaving(true);
    try {
      const json = editor.getJSON();
      const markdown = convertToMarkdown(editor.getJSON());
      await onSave(json, markdown);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, pageId?: string) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !editor) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (pageId) {
          formData.append('pageId', pageId);
        }

        const response = await fetch('/api/wiki/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          
          // Insert image if it's an image file
          if (file.type.startsWith('image/')) {
            editor.chain().focus().setImage({ src: result.url }).run();
          } else {
            // Insert as link for other file types
            const linkText = `📎 ${file.name}`;
            editor.chain().focus().insertContent(`<a href="${result.url}">${linkText}</a>`).run();
          }
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [editor]);

  const handleCopyFormat = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const marks = editor.state.doc.nodeAt(from)?.marks || [];
    const attributes = editor.getAttributes('textStyle');
    
    setCopiedFormat({
      marks,
      textStyle: attributes,
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      code: editor.isActive('code'),
      color: attributes.color,
      fontFamily: attributes.fontFamily,
      highlight: editor.isActive('highlight') ? editor.getAttributes('highlight') : null,
    });
    
    setFormatPainterActive(true);
  }, [editor]);

  const handlePasteFormat = useCallback(() => {
    if (!editor || !copiedFormat) return;
    
    // Clear existing formatting first
    editor.chain().focus().unsetAllMarks().run();
    
    // Apply copied formatting
    const chain = editor.chain().focus();
    
    if (copiedFormat.bold) chain.toggleBold();
    if (copiedFormat.italic) chain.toggleItalic();
    if (copiedFormat.underline) chain.toggleUnderline();
    if (copiedFormat.strike) chain.toggleStrike();
    if (copiedFormat.code) chain.toggleCode();
    if (copiedFormat.color) chain.setColor(copiedFormat.color);
    if (copiedFormat.fontFamily) chain.setFontFamily(copiedFormat.fontFamily);
    if (copiedFormat.highlight) chain.toggleHighlight({ color: copiedFormat.highlight.color });
    
    chain.run();
    
    setFormatPainterActive(false);
  }, [editor, copiedFormat]);

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

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`wiki-editor border border-gray-300 rounded-lg ${className}`}>
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

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Format Painter */}
        <ToolbarButton
          onClick={handleCopyFormat}
          isActive={formatPainterActive}
          title="Copy Format (select text and click to copy its formatting)"
        >
          <Paintbrush className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={handlePasteFormat}
          disabled={!copiedFormat}
          title="Paste Format (select text and click to apply copied formatting)"
          isActive={false}
        >
          <Paintbrush className="w-4 h-4 fill-current" />
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
          <option value="Comic Sans MS">Comic Sans MS</option>
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
        
        <label className="cursor-pointer">
          <ToolbarButton
            onClick={() => {}}
            disabled={isUploading}
            title="Upload File"
          >
            <Upload className="w-4 h-4" />
          </ToolbarButton>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt,.md"
            onChange={(e) => handleFileUpload(e, pageId)}
            className="hidden"
          />
        </label>
        
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

        <div className="flex-1"></div>

        {/* Actions */}
        {onPreview && (
          <ToolbarButton
            onClick={onPreview}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </ToolbarButton>
        )}
        
        {onSave && (
          <ToolbarButton
            onClick={handleSave}
            disabled={isSaving}
            title="Save"
          >
            <Save className="w-4 h-4" />
          </ToolbarButton>
        )}
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent 
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none min-h-[300px]"
        />
      </div>

      {/* Status bar */}
      <div className="border-t border-gray-200 px-4 py-2 text-sm text-gray-500 bg-gray-50 flex justify-between items-center">
        <div>
          {editor.storage.characterCount?.characters() || 0} characters
        </div>
        <div className="flex items-center space-x-2">
          {isUploading && <span className="text-blue-600">Uploading...</span>}
          {isSaving && <span className="text-green-600">Saving...</span>}
        </div>
      </div>
    </div>
  );
}

// Simple mention list component
class MentionList {
  constructor(private props: any) {}

  updateProps(props: any) {
    this.props = props;
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    // TODO: Implement navigation
  }

  downHandler() {
    // TODO: Implement navigation  
  }

  enterHandler() {
    // TODO: Implement selection
  }
}

