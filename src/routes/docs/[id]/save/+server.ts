import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import type { JSONContent } from '@tiptap/core';
import * as docs from '$lib/server/db/documents';
import { requireAccess } from '$lib/server/policy';

export const POST: RequestHandler = async ({ params, locals, request }) => {
  if (!locals.user) throw error(401, 'not signed in');

  // Owner OR shared editor can save (Phase 6).
  await requireAccess(params.id, locals.user.id);

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'invalid JSON');
  }

  const content = body.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw error(400, 'content must be a Tiptap JSONContent object');
  }
  if ((content as { type?: unknown }).type !== 'doc') {
    throw error(400, 'content.type must be "doc"');
  }

  await docs.updateContent(params.id, content as JSONContent, locals.user.id);
  return json({ ok: true });
};
