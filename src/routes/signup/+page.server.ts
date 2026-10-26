import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { findByEmail, createUser } from '$lib/server/db/users';
import { hashPassword, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth';

const MIN_PASSWORD_LEN = 8;

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    const displayName =
      String(data.get('display_name') ?? '').trim() || (email ? email.split('@')[0] : '');

    if (!email || !email.includes('@')) {
      return fail(400, { message: 'Valid email required.', email, displayName });
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return fail(400, {
        message: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
        email,
        displayName
      });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return fail(400, {
        message: 'An account already exists for this email. Try signing in.',
        email,
        displayName
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, displayName, passwordHash });

    cookies.set(SESSION_COOKIE, user.id, sessionCookieOptions);
    throw redirect(303, '/');
  }
};
