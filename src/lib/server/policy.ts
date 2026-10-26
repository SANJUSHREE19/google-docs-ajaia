import { error } from '@sveltejs/kit';
import * as docs from './db/documents';
import * as perms from './db/permissions';

export type DocAccess = 'owner' | 'editor' | null;

/**
 * Look up a document and the requesting user's access level in one place.
 * Returns null access if neither owner nor permission row.
 */
export async function getDocAccess(
  docId: string,
  userId: string
): Promise<{ doc: docs.Document | null; access: DocAccess }> {
  const doc = await docs.getById(docId);
  if (!doc) return { doc: null, access: null };
  if (doc.owner_id === userId) return { doc, access: 'owner' };

  const role = await perms.getRoleForUser(docId, userId);
  return { doc, access: role ? 'editor' : null };
}

/** For routes that any collaborator (owner or shared editor) can hit. */
export async function requireAccess(
  docId: string,
  userId: string
): Promise<{ doc: docs.Document; access: 'owner' | 'editor' }> {
  const { doc, access } = await getDocAccess(docId, userId);
  if (!doc) throw error(404, 'document not found');
  if (!access) throw error(403, 'forbidden');
  return { doc, access };
}

/** For owner-only routes (rename, delete, share, unshare). */
export async function requireOwner(docId: string, userId: string): Promise<docs.Document> {
  const { doc, access } = await getDocAccess(docId, userId);
  if (!doc) throw error(404, 'document not found');
  if (access !== 'owner') throw error(403, 'forbidden');
  return doc;
}
