// Single source of truth for which Tiptap extensions our editor supports.
//
// Imported by:
//   - src/lib/Tiptap.svelte           (the live editor instance)
//   - src/lib/upload.ts               (so generateJSON parses imports against
//                                      the SAME set; no drift between "what the
//                                      editor renders" and "what import preserves")
//
// Add a feature = touch this file. Both consumers pick it up.

import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';

export const editorExtensions = [
  // Bold, italic, underline, strike, code, headings (h1–h6), bullet/ordered
  // lists, blockquote, code block, horizontal rule, history, hard break.
  StarterKit,

  Link.configure({
    openOnClick: false, // don't navigate while editing
    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
  }),

  // Renders inline images. Mammoth produces data-URI <img> tags by default for
  // .docx images, so they Just Work without a separate upload pipeline.
  Image,

  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,

  TextAlign.configure({ types: ['heading', 'paragraph'] })
];
