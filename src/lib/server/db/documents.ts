import type { JSONContent } from '@tiptap/core';
import { getSupabase, hasSupabase } from './client';
import {
  localListOwnedByUser,
  localListSharedWithUser,
  localGetDocById,
  localCreateDoc,
  localRenameDoc,
  localUpdateDocContent,
  localDeleteDocById
} from './localDb';

export type Document = {
  id: string;
  title: string;
  content: JSONContent;
  owner_id: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
};

export async function listOwnedByUser(userId: string): Promise<Document[]> {
  if (!hasSupabase()) return localListOwnedByUser(userId);
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listSharedWithUser(userId: string): Promise<Document[]> {
  if (!hasSupabase()) return localListSharedWithUser(userId);
  const supa = getSupabase();
  const { data: perms, error: pErr } = await supa
    .from('document_permissions')
    .select('document_id')
    .eq('user_id', userId);
  if (pErr) throw pErr;
  const ids = (perms ?? []).map((p) => p.document_id);
  if (ids.length === 0) return [];

  const { data, error } = await supa
    .from('documents')
    .select('*')
    .in('id', ids)
    .neq('owner_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getById(id: string): Promise<Document | null> {
  if (!hasSupabase()) return localGetDocById(id);
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function create(
  ownerId: string,
  opts: { title?: string; content?: JSONContent } = {}
): Promise<Document> {
  if (!hasSupabase()) return localCreateDoc(ownerId, opts);
  const { data, error } = await getSupabase()
    .from('documents')
    .insert({
      owner_id: ownerId,
      title: opts.title ?? 'Untitled',
      content: opts.content ?? EMPTY_CONTENT,
      updated_by: ownerId
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function rename(id: string, title: string, byUserId: string): Promise<void> {
  if (!hasSupabase()) return localRenameDoc(id, title, byUserId);
  const { error } = await getSupabase()
    .from('documents')
    .update({ title, updated_by: byUserId })
    .eq('id', id);
  if (error) throw error;
}

export async function updateContent(
  id: string,
  content: JSONContent,
  byUserId: string
): Promise<void> {
  if (!hasSupabase()) return localUpdateDocContent(id, content, byUserId);
  const { error } = await getSupabase()
    .from('documents')
    .update({ content, updated_by: byUserId })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteById(id: string): Promise<void> {
  if (!hasSupabase()) return localDeleteDocById(id);
  const { error } = await getSupabase().from('documents').delete().eq('id', id);
  if (error) throw error;
}
