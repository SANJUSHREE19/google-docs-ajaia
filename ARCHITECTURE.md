# Architecture Note

**Candidate:** Sanjushree Golla  
**Role:** Technical Program & Project Manager, AI Delivery  
**Company:** Ajaia LLC  

---

## 1. Stack at a Glance

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend + Backend** | SvelteKit (Svelte 5 + Runes) | Unified full-stack repository, minimal boilerplate, zero runtime overhead; server form actions handle mutations cleanly without separate API routing layers. |
| **Rich-Text Editor** | Tiptap v3 | Robust ProseMirror engine foundation; modular extensions; native Svelte component lifecycle integration; output formatted as structured `JSONContent`. |
| **Database** | Supabase Postgres | Hosted Postgres database on free tier with native JSONB column support for document content; zero infrastructure management overhead. |
| **Local Fallback** | SQLite (`.data/local.sqlite`) | Built-in offline mode when Supabase credentials are not present; enables instant local evaluation for reviewers. |
| **Authentication** | Self-Managed: `public.users` (scrypt + session cookie) | Avoids third-party OAuth/email dependency risks; fully owned and audited with constant-time verification. |
| **Deployment** | Vercel (Node.js 24 runtime) | Git-integrated continuous deployment, serverless function scaling, and automated build pipeline. |
| **Testing** | Vitest | High-speed unit testing targeting security-critical password hashing routines. |

---

## 2. Directory Layout & Component Hierarchy

```
src/
├── routes/
│   ├── +layout.svelte             # Global shell, user status badge, and sign-out controls
│   ├── +layout.server.ts          # Root data loader (currentUser and registered user list for sharing)
│   ├── +page.svelte               # Dashboard view: Owned docs, Shared docs, file upload, and new doc action
│   ├── +page.server.ts            # Dashboard server actions: create, rename, and delete
│   ├── login/                     # Email + password sign-in (with quick-select test buttons)
│   ├── signup/                    # User registration with scrypt password hashing
│   ├── auth/logout/               # POST endpoint: invalidates session cookie and redirects to /login
│   ├── docs/[id]/
│   │   ├── +page.svelte           # Main editor view: synchronized title input, Tiptap toolbar, and share panel
│   │   ├── +page.server.ts        # Document loader + server actions: rename, grant access, revoke access
│   │   └── save/+server.ts        # POST endpoint: autosave handler for debounced Tiptap JSONContent
│   └── api/import/                # POST endpoint: receives parsed file content and persists new document
├── lib/
│   ├── Tiptap.svelte              # Core editor component and interactive formatting toolbar
│   ├── editorExtensions.ts        # Single source of truth for all Tiptap extensions
│   ├── upload.ts                  # Client-side .txt, .md, and .docx parser using marked and mammoth
│   ├── haptics.ts                 # Subtle UI micro-interaction feedback
│   └── server/
│       ├── auth.ts                # Cryptographic scrypt hashing and session cookie management
│       ├── policy.ts              # Centralized authorization guards (requireOwner, requireAccess)
│       ├── actions/documents.ts   # Shared mutation logic for renaming and deletion
│       └── db/
│           ├── client.ts          # Lazy-initialized Supabase client with WebSocket polyfill
│           ├── users.ts           # User repository (find, create, list)
│           ├── documents.ts       # Document repository (CRUD, listOwned, listShared)
│           ├── permissions.ts     # Document permissions repository (grant, revoke, list)
│           └── localDb.ts         # SQLite offline database engine for local mode
└── hooks.server.ts                # Server-side authentication guard and route protection
```

---

## 3. Key Design Choices (Google Docs Inspirations)

1. **Document Content as Structured JSONB:**  
   Document content is stored as Tiptap `JSONContent` (a structured AST node tree) within a Postgres JSONB column, rather than raw HTML or unescaped markdown strings. This prevents arbitrary script injection and provides the precise data shape necessary for future operational transformation or collaborative diffing.
2. **Normalized Permissions Join Table:**  
   Implemented `document_permissions(document_id, user_id, role, granted_at)` from day one. While shipping with an `editor` role to satisfy prompt requirements, the schema natively accommodates future roles (`viewer`, `commenter`) without table rewrites or migrations.
3. **Centralized Access Control Policy (`policy.ts`):**  
   Every mutating endpoint strictly invokes `requireOwner` (for title changes, access grants, deletions) or `requireAccess` (for reading and autosaving). The client session cookie acts strictly as an identity token, never as an authorization grant.
4. **Unified Editor Extension Registry (`editorExtensions.ts`):**  
   Both the interactive editor (`Tiptap.svelte`) and the file import pipeline (`upload.ts`) share the same extension definitions. This guarantees that imported document elements (tables, formatting, links) always render consistently with the live editor.
5. **Debounced Autosave with Keepalive Flush:**  
   Editor state changes are debounced to 800ms to minimize network chatter while typing. When a user navigates away or closes the tab, a `keepalive: true` fetch fires immediately to ensure unsaved keystrokes are not lost.

---

## 4. Security Architecture

- **Server-Side Enforcement:** The browser client never queries Supabase or the database directly; all persistence occurs through server-side endpoints.
- **Cryptographic Password Storage:** Passwords are hashed using Node.js built-in `scrypt` (`N=16384, r=8, p=1`) with cryptographically secure random salts. Verification uses `crypto.timingSafeEqual` to eliminate timing attack vectors.
- **Constant-Time Missing User Handling:** When a non-existent email attempts sign-in, `verifyPassword` still runs against a dummy hash to keep execution duration uniform and mitigate email enumeration.
- **Cookie Security:** Session tokens are stored in `HttpOnly`, `SameSite=Lax` cookies with strict 30-day lifespans.

---

## 5. Deliberate Scope Cuts & Tradeoffs

To ensure delivery of a robust, high-fidelity core within the 4–6 hour timebox, the following items were intentionally deprioritized:

| Feature Cut | Product & Technical Rationale |
|---|---|
| **Live Multi-Cursor CRDT (Yjs/OT)** | Real-time presence indicators and conflict-free replicated data types introduce significant synchronization complexity. Deprioritized to ensure rock-solid persistence, sharing permissions, and document CRUD. |
| **Object Cloud Storage Pipeline** | Embedded images inside uploaded `.docx` files are preserved cleanly as inline data URIs. Direct upload of image files from local disk to cloud storage buckets (S3 / Supabase Storage) was cut to minimize third-party service dependencies. |
| **Email Reset Tokens (Forgot Password)** | Replaced external email delivery services with self-contained, tamper-proof scrypt auth to eliminate external configuration failure points. |
| **Granular Viewer/Commenter UI** | The underlying schema supports granular roles (`role CHECK (role IN ('editor', 'viewer', 'commenter'))`), but the UI exposes only the primary `editor` flow to keep the interface simple. |

---

## 6. Future Engineering Roadmap (Next 2–4 Hours & Beyond)

1. **Active Realtime Presence:** Integrate Supabase Realtime presence channels to show live viewer badges in the document header when multiple users view the same document simultaneously.
2. **Automated Policy Integration Tests:** Expand Vitest coverage to mock the database client and programmatically assert permission rejection across unauthorized routes.
3. **Markdown / HTML Export:** Add an export button allowing users to download edited documents back to their local drive as `.md` or formatted `.html`.
