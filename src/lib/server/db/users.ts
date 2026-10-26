import { getSupabase, hasSupabase } from './client';
import {
  localListUsers,
  localGetUserById,
  localFindByEmail,
  localCreateUser
} from './localDb';

export type User = {
  id: string;
  email: string;
  display_name: string;
};

/** Internal: user row including password_hash. Never leak to clients. */
export type UserWithHash = User & { password_hash: string };

export async function listUsers(): Promise<User[]> {
  if (!hasSupabase()) return localListUsers();
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, display_name')
    .order('display_name');
  if (error) throw error;
  return data ?? [];
}

export async function getUserById(id: string): Promise<User | null> {
  if (!hasSupabase()) return localGetUserById(id);
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, display_name')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findByEmail(email: string): Promise<UserWithHash | null> {
  if (!hasSupabase()) return localFindByEmail(email);
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, display_name, password_hash')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser(args: {
  email: string;
  displayName: string;
  passwordHash: string;
}): Promise<User> {
  if (!hasSupabase()) return localCreateUser(args);
  const { data, error } = await getSupabase()
    .from('users')
    .insert({
      email: args.email.toLowerCase(),
      display_name: args.displayName,
      password_hash: args.passwordHash
    })
    .select('id, email, display_name')
    .single();
  if (error) throw error;
  return data;
}
