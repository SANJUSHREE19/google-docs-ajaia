# Supabase Setup (do this in parallel with Phase 2 coding)

## What you'll get

A free hosted Postgres database with three tables (`users`, `documents`, `document_permissions`) and three seeded users (Alice, Bob, Carol). Should take ~5 minutes.

## 1. Create the project (2 min)

1. Go to https://supabase.com → **Start your project** → sign up (GitHub login is fastest).
2. Click **New project**.
3. Fill in:
   - **Name:** `google-docs-ajaia` (anything works)
   - **Database password:** generate one and save it in a password manager — you won't need it for app code, but you'd need it to log into Postgres directly.
   - **Region:** pick the one closest to you.
   - **Pricing plan:** Free.
4. Click **Create new project**. It takes ~2 minutes to provision.

## 2. Run the schema SQL (1 min)

1. In the Supabase dashboard, sidebar → **SQL Editor** → **New query**.
2. Paste the entire SQL block below.
3. Click **Run** (bottom right).
4. You should see "Success. No rows returned" or similar.

```sql
-- Enable uuid generation (gen_random_uuid is built-in on Supabase)
-- so no extension toggle needed.

-- Users (seeded; we mock auth, so no Supabase Auth integration)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Permissions (join table; ready for future viewer/commenter roles)
CREATE TABLE document_permissions (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer', 'commenter')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, user_id)
);

-- Auto-update updated_at on row update
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_permissions_user ON document_permissions(user_id);

-- Seed users (fixed UUIDs so the app can reference them without lookups)
INSERT INTO users (id, email, display_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'Alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com',   'Bob'),
  ('33333333-3333-3333-3333-333333333333', 'carol@example.com', 'Carol');
```

## 3. Grab your keys (1 min)

1. Sidebar → **Project Settings** (gear icon) → **API Keys**.
2. Use the **"New keys"** tab — Supabase recently rolled out a new key format (`sb_publishable_...` / `sb_secret_...`); the older `anon` / `service_role` JWT keys are now labeled "Legacy" and shouldn't be used for new projects.
3. Copy these **two** values into a scratchpad — we'll paste them into `.env.local`:

| Label in dashboard | Goes in `.env.local` as |
|---|---|
| **Project URL** (Settings → API → Project URL) | `PUBLIC_SUPABASE_URL` |
| **Secret key** (`sb_secret_...`, click reveal) | `SUPABASE_SECRET_KEY` |

> We use Supabase **only as Postgres** (via the secret key, server-side). Auth is handled by us — `public.users.password_hash` + scrypt + a session cookie. We do not use Supabase Auth, so no publishable key is needed.

## 4. About Row-Level Security (skip / no action)

Supabase will show a banner saying "RLS is disabled" on your new tables. **That's fine for this assignment.** Our server uses the `service_role` key (which bypasses RLS), and the client never talks directly to Supabase. Production code would either enable RLS with policies or restrict to server-only access. We document this tradeoff in `ARCHITECTURE.md`.

## 5. Email + password auth migration (Phase 7.75)

**We do not use Supabase Auth.** Sign-up and sign-in are handled by us: `public.users.password_hash` (scrypt-derived) + a session cookie. Supabase is just a Postgres database.

Run this in **SQL Editor**:

```sql
-- 1. Tear down any leftovers from earlier auth experiments
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- 2. Wipe everything (documents + permissions cascade from public.users)
DELETE FROM public.users;
DELETE FROM auth.users;

-- 3. Add password_hash column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE public.users ALTER COLUMN password_hash DROP DEFAULT;
```

> ⚠ This deletes all documents and permissions from earlier phases. Expected — those were proof-of-concept with seeded UUIDs.

Verify:

```sql
SELECT count(*) FROM public.users;  -- 0
\d public.users                      -- you should see password_hash TEXT NOT NULL
```

### 5b. `.env.local` shape

```
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

(Two vars only — no publishable key, no Supabase Auth config.) Restart `npm run dev` after editing.

### 5c. Verify the app

1. Visit `/` → redirected to `/login`.
2. Click **Sign up** at the bottom → fill email + password (≥8 chars) + optional display name → **Sign up**.
3. Land at `/` logged in. Header shows your name.
4. **Logout** → returns to `/login` → enter same credentials → lands at `/` again.

## 6. Free-tier behavior (just so you know)

- Free Supabase projects **pause after ~7 days of inactivity**. Click "Restore" in the dashboard if it pauses.
- 500 MB database, 5 GB bandwidth — far more than this assignment will use.

## Verify it worked

In SQL Editor, run:

```sql
SELECT id, display_name FROM users ORDER BY display_name;
```

You should get three rows: Alice / Bob / Carol with the fixed UUIDs above.

---

When Phase 3 starts, paste the three keys into `.env.local` (template at `.env.example`). Done.
