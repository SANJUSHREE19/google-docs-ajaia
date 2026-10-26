import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './auth';

// We test the password layer specifically because we hand-rolled it.
// Anything we wrote with `node:crypto` ourselves earns a unit test more
// than something that only wraps a well-tested library.
describe('auth — password hashing', () => {
  it('verifies a correctly hashed password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password against the same hash', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('rejects a single-character tampering of the stored hash', async () => {
    const hash = await hashPassword('correct');
    const last = hash.slice(-1);
    const tampered = hash.slice(0, -1) + (last === 'a' ? 'b' : 'a');
    expect(await verifyPassword('correct', tampered)).toBe(false);
  });

  it('returns false (does not throw) on a malformed stored hash', async () => {
    expect(await verifyPassword('any', '')).toBe(false);
    expect(await verifyPassword('any', 'no-colon')).toBe(false);
    expect(await verifyPassword('any', ':')).toBe(false);
  });

  it('produces unique hashes for the same password (random salt per call)', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toBe(b);
    // both still verify against the same plaintext
    expect(await verifyPassword('same-password', a)).toBe(true);
    expect(await verifyPassword('same-password', b)).toBe(true);
  });
});
