import { getSupabase, hasSupabase } from './client';
import type { User } from './users';
import {
  localListPermissionsForDoc,
  localGetRoleForUser,
  localGrantAccess,
  localRevokeAccess
} from './localDb';

export type Role = 'editor' | 'viewer' | 'commenter';

export type Permission = {
  document_id: string;
  user_id: string;
  role: Role;
  granted_at: string;
};

export type PermissionWithUser = Permission & { user: User };

export async function listForDoc(docId: string): Promise<PermissionWithUser[]> {
  if (!hasSupabase()) return localListPermissionsForDoc(docId);
  const { data, error } = await getSupabase()
    .from('document_permissions')
    .select('document_id, user_id, role, granted_at, users(id, email, display_name)')
    .eq('document_id', docId)
    .order('granted_at', { ascending: true });
  if (error) throw error;

  type Row = Omit<Permission, never> & { users: User | null };
  return (data as Row[] | null ?? [])
    .filter((r): r is Row & { users: User } => r.users !== null)
    .map((r) => ({
      document_id: r.document_id,
      user_id: r.user_id,
      role: r.role,
      granted_at: r.granted_at,
      user: r.users
    }));
}

export async function getRoleForUser(docId: string, userId: string): Promise<Role | null> {
  if (!hasSupabase()) return localGetRoleForUser(docId, userId);
  const { data, error } = await getSupabase()
    .from('document_permissions')
    .select('role')
    .eq('document_id', docId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as Role | undefined) ?? null;
}

export async function grantAccess(
  docId: string,
  userId: string,
  role: Role = 'editor'
): Promise<void> {
  if (!hasSupabase()) return localGrantAccess(docId, userId, role);
  const { error } = await getSupabase()
    .from('document_permissions')
    .upsert(
      { document_id: docId, user_id: userId, role },
      { onConflict: 'document_id,user_id' }
    );
  if (error) throw error;
}

export async function revokeAccess(docId: string, userId: string): Promise<void> {
  if (!hasSupabase()) return localRevokeAccess(docId, userId);
  const { error } = await getSupabase()
    .from('document_permissions')
    .delete()
    .eq('document_id', docId)
    .eq('user_id', userId);
  if (error) throw error;
}
