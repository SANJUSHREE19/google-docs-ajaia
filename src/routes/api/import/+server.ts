import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import type { JSONContent } from '@tiptap/core';
import * as docs from '$lib/server/db/documents';

const TITLE_MAX = 200;

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) throw error(401, 'not signed in');

  let body: { title?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'invalid JSON');
  }

  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  const title =
    rawTitle.length > 0 && rawTitle.length <= TITLE_MAX ? rawTitle : 'Imported document';

  const content = body.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw error(400, 'content must be a JSONContent object');
  }
  if ((content as { type?: unknown }).type !== 'doc') {
    throw error(400, 'content.type must be "doc"');
  }

  const doc = await docs.create(locals.user.id, {
    title,
    content: content as JSONContent
  });
  return json({ id: doc.id });
};
