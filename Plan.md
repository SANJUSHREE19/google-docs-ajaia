# Plan: Google Docs–Style Collaborative Editor

**Candidate:** Sanjushree Golla  
**Role:** Technical Program & Project Manager, AI Delivery  
**Company:** Ajaia LLC  

> Master scope plan and architectural execution strategy. Source of truth for scope boundaries and milestone deliverables.

---

## 1. Vision & Constraints

Ship the strongest small full-stack collaborative document editor within a **4–6 hour timebox**, applying deliberate scope cuts and prioritizing user experience, architectural cleanliness, and delivery reliability over unbounded feature breadth.

---

## 2. Technical Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend & Backend** | SvelteKit (Svelte 5 + Runes) | Full-stack unified repo; server form actions handle mutations cleanly. |
| **Rich-Text Editor** | Tiptap v3 | Robust ProseMirror-backed foundation; modular extensions; native Svelte 5 support. |
| **Database** | Supabase Postgres | Hosted Postgres database with native JSONB support; zero infrastructure overhead. |
| **Local Mode** | SQLite (`.data/local.sqlite`) | Automatic zero-config offline fallback for local development. |
| **Deployment** | Vercel (Node.js 24) | Direct GitHub CI/CD, fast edge routing, serverless function scaling. |
| **Authentication** | Self-Managed `scrypt` + Session Cookie | High-security cryptographic password hashing without external service dependencies. |
| **Automated Testing** | Vitest | Focused unit test suite on security-critical password hashing. |
| **Document Schema** | Tiptap `JSONContent` in JSONB | Structured AST node tree preventing HTML injection and ready for future diffing. |
| **Permissions Schema** | Join table: `document_permissions` | Normalized structure supporting multi-user sharing and future role expansions. |

---

## 3. Explicit Scope Boundaries (Out of Scope)

To meet the timebox without compromising quality, the following features were deliberately scoped out:
- True multi-cursor live collaboration (CRDT/OT via Yjs or Hocuspocus).
- Inline document commenting and suggestion track-changes mode.
- Link-based sharing (ACL inheritance) and soft-delete trash bins.
- Cloud object storage for image upload attachments (embedded `.docx` images are preserved as data URIs).
- Forgot-password email reset tokens (self-contained password auth was prioritized).

---

## 4. Phase Breakdown

- **Phase 1: Foundation Design (Completed)**  
  Architecture planning, stack evaluation, scope cut decisions, and schema definition.
- **Phase 2: Project Skeleton & Tiptap Boot (Completed)**  
  SvelteKit scaffold, Tiptap v3 integration, basic formatting toolbar (bold, italic, underline, lists, headings).
- **Phase 3: Database Repositories & Offline Engine (Completed)**  
  Data access layer in `src/lib/server/db/`, Supabase client setup, and SQLite local fallback.
- **Phase 4: Document CRUD & Renaming (Completed)**  
  Dashboard document listing, creation, inline and header title renaming, and deletion.
- **Phase 5: Editor Persistence & Debounced Autosave (Completed)**  
  Route `/docs/[id]` wired to database, 800ms debounced autosave, and `keepalive` unmount flush.
- **Phase 6: Multi-User Sharing (Completed)**  
  Owner-controlled access grant/revoke modal, dashboard division ("Your documents" vs. "Shared with you"), and policy checks.
- **Phase 7: Multi-Format File Upload (Completed)**  
  Client-side parser for `.txt`, `.md`, and `.docx` converting uploads into new editable documents.
- **Phase 7.5: Editor Fidelity & Extension Unification (Completed)**  
  Extracted `src/lib/editorExtensions.ts` supporting tables, hyperlinks, text alignment, and images across both the live editor and the upload parser.
- **Phase 7.75: Cryptographic Authentication (Completed)**  
  Self-contained email + password authentication using `node:crypto` `scrypt` hashing with constant-time verification.
- **Phase 8: Production Polish, Tests, and Vercel Deployment (Completed)**  
  Automated Vitest test suite (`npm test`), Node.js 24 Vercel deployment, and comprehensive documentation.

---

## 5. Potential Enhancements (Next 2–4 Hours)

1. **Active Viewer Presence:** Supabase Realtime channel showing collaborator avatars in the document header.
2. **Export to Markdown / HTML:** Client-side document download feature.
3. **Automated Policy Tests:** Unit tests asserting permission rejection in `policy.ts`.
