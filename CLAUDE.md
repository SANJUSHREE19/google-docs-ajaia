# Project Guardrails — Ajaia Take-Home

> Source spec: `ASSIGNMENT.md`. Master plan: `Plan.md`. Live status: `Progress.md`.
> This file exists to keep us from drifting off-spec across sessions.

## Hard constraints (do not violate)

- **Timebox: 4–6 hours total.** Spec literally says: "A focused, well-reasoned partial solution is better than an overextended build."
- **Reviewers must not need to pay for any dependency or service.**
- **Required deliverables (do not skip):**
  - Live deployment URL
  - Source code
  - `README.md` (setup + run instructions)
  - Architecture note (Markdown or PDF)
  - AI workflow note (Markdown or PDF)
  - `SUBMISSION.md` (manifest)
  - One meaningful automated test
  - Walkthrough video URL (3–5 min, public Loom/YouTube/etc.)
  - Test accounts / seeded users for sharing review
  - Screenshots / demo GIF if setup needs extra steps

## Required functionality (do not cut)

1. **Doc creation/editing:** create, rename, edit in browser, save, reopen
2. **Rich-text formatting:** bold, italic, underline, headings or text-size variation, bulleted + numbered lists
3. **File upload:** at least one supported type (.txt/.md/.docx) imported into the workflow; supported types stated clearly in UI + README
4. **Sharing:** document owner, grant access to another user, visible owned-vs-shared distinction
5. **Persistence:** documents survive refresh, formatting preserved, shared access demonstrable
6. **Mocked auth + seeded users is acceptable** (spec explicitly allows this)
7. **Validation + error handling** at minimum

## Bias toward scope cuts

- "Prioritize depth in a few important areas over shallow coverage everywhere" — direct quote from spec
- Stretch goals are **optional**. Never pursue them at the expense of core.
- For any partial feature, document in submission: what works / what's incomplete / what we'd build next with 2–4 more hours
- Strong candidates "make deliberate scope cuts and explain them clearly" — communicate tradeoffs, don't apologize

## What's being evaluated

- Product judgment + scope cuts under time pressure
- Full-stack execution (frontend, backend, persistence, access logic)
- Editor experience quality within chosen scope
- File upload + sharing logic
- Deploy ability + testable build
- Code clarity, maintainability, delivery discipline
- Mature use of AI tools (practical, not voluminous)
- Written + verbal communication

## Explicitly out of scope

Do **not** build: real auth/signup, true co-editing (CRDT/OT/Yjs), comments, suggestions, version history graphs, link-based sharing, ACL inheritance, soft-delete trash, mobile-optimized layout, RLS policies, rate limiting, audit logs.

## Stack (locked in Phase 1)

SvelteKit (Svelte 5 + runes) · Tiptap **v3** · Supabase Postgres · Vercel · Vitest. Mocked auth via cookie + seeded users (Alice / Bob / Carol).

## Working style

- Phased delivery with manual-test exit gates — see `Progress.md`
- **Thin DB repo layer** at `src/lib/server/db/*` — only that folder imports `@supabase/...`
- Doc content stored as **Tiptap `JSONContent` in JSONB**, never HTML strings
- Permissions as a **join table** from day one: `document_permissions(doc_id, user_id, role)` — even though we ship only `editor` role
- `updated_at` + `updated_by` on every document
