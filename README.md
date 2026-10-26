# Google Docs (AJAIA take-home)

Lightweight collaborative document editor inspired by Google Docs. Built by **Sanjushree Golla** for the Ajaia LLC **Technical Program & Project Manager, AI Delivery** take-home assignment.

> **Live Production URL:** https://google-docs-ajaia-cx5tdq6yq-sanju-6cf3.vercel.app  
> **GitHub Repository:** https://github.com/SANJUSHREE19/google-docs-ajaia  
> Walkthrough video link in [`SUBMISSION.md`](./SUBMISSION.md).

---

## Core Capabilities (Per Specification)

1. **Document Creation and Editing:**
   - Create new documents, rename documents (both inline from the dashboard list and directly in the document editor header), edit, save, reopen, and delete.
   - Rich-text editor powered by Tiptap v3: Bold, italic, underline, strikethrough, headings (H1–H3), bulleted and numbered lists, text alignment, links, contextual tables (add/delete row/col), and images.
   - Debounced autosave (800ms) with best-effort `keepalive` flush on navigation.

2. **File Upload & Import:**
   - Direct import of `.txt`, `.md`, and `.docx` files (up to 2 MB) parsed client-side into structured document drafts.
   - Preserves headings, paragraphs, lists, bold/italic, alignment, tables, links, and embedded images.

3. **Sharing & Access Control:**
   - Document owners can grant and revoke editor access to other users.
   - Clear visual distinction on the dashboard between "Your documents" (owned) and "Shared with you".
   - Centralized policy enforcement (`requireOwner` / `requireAccess`) prevents unauthorized mutations.

4. **Persistence:**
   - Hosted Supabase Postgres database with JSONB document storage.
   - Offline / local fallback using built-in SQLite (`.data/local.sqlite`) for local development without credentials.

5. **Engineering & Security Quality:**
   - Fully self-managed email + password authentication using `node:crypto` `scrypt` hashing with constant-time verification.
   - Comprehensive automated unit tests for password hashing security (`npm test`).
   - Clean SvelteKit architecture deployed to Vercel.

---

## Stack

- **Framework:** SvelteKit (Svelte 5 + runes)
- **Editor:** Tiptap v3 (ProseMirror-backed)
- **Database:** Supabase Postgres (JSONB document storage) / Local SQLite fallback
- **Authentication:** Self-managed scrypt password hashing + HttpOnly session cookie
- **Hosting:** Vercel (Node.js 24 runtime)
- **Testing:** Vitest

---

## Test Accounts

### 1-Click Quick Select Accounts
On the live login screen, click any of the pre-configured quick buttons:

| Name | Email | Password | Role |
|---|---|---|---|
| **Sanju** | `sanju@example.com` | `password123` | Document Owner / Primary User |
| **Anil** | `anil@example.com` | `password123` | Collaborator / Shared User |
| **Raju** | `raju@example.com` | `password123` | Collaborator / Shared User |

### Fresh Sign Up
Reviewers can also sign up with any email address and password (minimum 8 characters) at `/signup` (linked directly from `/login`).

---

## Local Setup & Run Instructions

```bash
git clone https://github.com/SANJUSHREE19/google-docs-ajaia.git
cd google-docs-ajaia
npm install

# Optional: To connect to your Supabase instance, copy the env file
cp .env.example .env.local
# Fill in PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (see docs/SUPABASE_SETUP.md)
# If env vars are left blank, the app runs in Local Mode using built-in SQLite automatically!

npm run dev
```

Open `http://localhost:5173`. You will be directed to `/login`.

---

## Automated Tests

Run the test suite:

```bash
npm test
```

Executes security tests in `src/lib/server/auth.test.ts` covering password hashing round-trips, wrong-password rejection, tampered hash detection, malformed hash safety, and salt uniqueness.

---

## Architecture & Workflow Documentation

- [`SUBMISSION.md`](./SUBMISSION.md) — Submission manifest, live URLs, walkthrough link, and feature status.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Technical program architecture, stack rationale, design choices, scope cuts, and future roadmap.
- [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) — Required AI-native workflow reflection (tools used, where AI accelerated delivery, rejected proposals, and verification).
- [`Plan.md`](./Plan.md) — Master scope and phase breakdown.
- [`Progress.md`](./Progress.md) — Phase status and manual-test exit criteria.
- [`ASSIGNMENT.md`](./ASSIGNMENT.md) — Original take-home specification.
