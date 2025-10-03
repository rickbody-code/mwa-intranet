import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';

const extensions = [
  StarterKit,
  Link.configure({
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
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full',
    },
  }),
  TableRow,
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left',
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-gray-300 px-4 py-2',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TextStyle,
  Color,
  Highlight.configure({
    HTMLAttributes: {
      class: 'bg-yellow-200',
    },
  }),
  Underline,
];

export function renderTiptapContent(json: any): string {
  if (!json) return '';
  
  try {
    return generateHTML(json, extensions);
  } catch (error) {
    console.error('Error rendering TipTap content:', error);
    return '<p class="text-red-600">Error rendering content</p>';
  }
}
