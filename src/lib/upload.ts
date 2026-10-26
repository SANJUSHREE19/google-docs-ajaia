// Client-only helpers for parsing user-uploaded files into Tiptap JSONContent.
// Lives client-side because Tiptap's `generateJSON` and mammoth's browser build
// both expect a real DOM — running them in Node would mean shipping JSDOM.
//
// Supported types are listed in SUPPORTED_TYPES + the README.

import type { JSONContent } from '@tiptap/core';
import { generateJSON } from '@tiptap/core';
import { editorExtensions } from '$lib/editorExtensions';
import { marked } from 'marked';
// Vite resolves the "browser" field in mammoth's package.json automatically.
import mammoth from 'mammoth';

export const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.docx'] as const;
export const SUPPORTED_LABEL = SUPPORTED_EXTENSIONS.join(', ');

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export type ImportResult = { title: string; content: JSONContent };

export async function parseFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `file too large (${(file.size / 1024 / 1024).toFixed(1)} MB; max 2 MB)`
    );
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
  const title = file.name.replace(/\.[^.]+$/, '') || 'Imported document';

  switch (ext) {
    case '.txt':
      return { title, content: textToJSON(await file.text()) };

    case '.md': {
      const html = await marked.parse(await file.text());
      return { title, content: generateJSON(html, editorExtensions) };
    }

    case '.docx': {
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      return { title, content: generateJSON(html, editorExtensions) };
    }

    default:
      throw new Error(`unsupported file type "${ext}". Supported: ${SUPPORTED_LABEL}`);
  }
}

function textToJSON(text: string): JSONContent {
  const lines = text.split(/\r?\n/);
  return {
    type: 'doc',
    content: lines.map((line) =>
      line.length === 0
        ? { type: 'paragraph' }
        : { type: 'paragraph', content: [{ type: 'text', text: line }] }
    )
  };
}
