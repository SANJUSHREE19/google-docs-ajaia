import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { findByEmail } from '$lib/server/db/users';
import { verifyPassword, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth';

// Real-shaped dummy hash used to keep response time roughly constant when the
// email isn't found — same scrypt cost as a real comparison, mitigates basic
// email enumeration via timing.
const DUMMY_HASH = '00:' + '0'.repeat(128);

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { message: 'Email and password are required.', email });
    }

    const user = await findByEmail(email);
    // Always run scrypt — even when no user — so timing is the same.
    const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !ok) {
      return fail(400, { message: 'Invalid email or password.', email });
    }

    cookies.set(SESSION_COOKIE, user.id, sessionCookieOptions);
    throw redirect(303, '/');
  }
};
