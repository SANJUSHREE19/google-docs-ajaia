import type { User } from '$lib/server/db/users';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
    }
  }
}

export {};
