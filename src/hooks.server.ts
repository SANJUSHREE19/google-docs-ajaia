import { type Handle, redirect } from '@sveltejs/kit';
import { getUserById } from '$lib/server/db/users';
import { SESSION_COOKIE } from '$lib/server/auth';

const PUBLIC_PREFIXES = ['/login', '/signup', '/auth'];

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;

  const userId = event.cookies.get(SESSION_COOKIE);
  if (userId) {
    try {
      event.locals.user = await getUserById(userId);
    } catch (err) {
      console.warn('[auth] cannot load user:', (err as Error).message);
    }
  }

  const path = event.url.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));

  if (!event.locals.user && !isPublic) {
    throw redirect(303, '/login');
  }
  if (event.locals.user && (path === '/login' || path === '/signup')) {
    throw redirect(303, '/');
  }

  return resolve(event);
};
