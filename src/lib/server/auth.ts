import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;
const SALT_BYTES = 16;

/**
 * Hash a plaintext password with scrypt (Node built-in, no extra dep).
 * Stored format: `<salt-hex>:<derived-hex>`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = await scryptAsync(plain, salt, KEYLEN);
  return `${salt}:${derived.toString('hex')}`;
}

/** Constant-time compare against a stored `<salt>:<hash>` value. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derived = await scryptAsync(plain, salt, KEYLEN);
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export const SESSION_COOKIE = 'session_user_id';

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30 // 30 days
};
