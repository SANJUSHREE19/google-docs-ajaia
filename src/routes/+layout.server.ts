import type { LayoutServerLoad } from './$types';
import { listUsers, type User } from '$lib/server/db/users';
import { hasSupabase } from '$lib/server/db/client';

export const load: LayoutServerLoad = async ({ locals }) => {
  const isLocal = !hasSupabase();
  if (!locals.user) return { currentUser: null, allUsers: [] as User[], dbError: null, isLocal };

  let allUsers: User[] = [];
  let dbError: string | null = null;
  try {
    allUsers = await listUsers();
  } catch (err) {
    dbError = (err as Error).message;
  }

  return { currentUser: locals.user, allUsers, dbError, isLocal };
};
