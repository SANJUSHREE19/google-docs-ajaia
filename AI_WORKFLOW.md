# AI-Native Workflow Note

**Candidate:** Sanjushree Golla  
**Role:** Technical Program & Project Manager, AI Delivery  
**Company:** Ajaia LLC  

> This document details how AI was integrated into the product-engineering workflow for the take-home assignment, what was accepted, what was challenged or rejected, and how system reliability and user experience were verified.

---

## 1. AI Tools Used

- **Agentic AI Coding Assistant (Antigravity / Gemini 3.8 / Claude)**: Primary engineering collaborator used for architectural tradeoff evaluations, boilerplate scaffolding, database repository implementation, deployment troubleshooting, and refactoring.
- **Targeted Documentation Retrieval**: Live web lookups to inspect up-to-date API signatures and breaking changes (e.g., Tiptap v3 Svelte integration, Vercel Node.js runtime compatibility rules, and Supabase key formats).

---

## 2. Collaboration Model & Product Management Discipline

Rather than delegating open-ended implementation to AI, I drove the project through an **iterative, milestone-based delivery framework**:

1. **Pre-Agreed Guardrails ([`Plan.md`](./Plan.md))**: Defined clear scope boundaries, architectural constraints, and explicit cut-lists before generating any code.
2. **Phase Exit Gates ([`Progress.md`](./Progress.md))**: Mandated manual verification gates in the browser at the completion of each phase before proceeding to the next.
3. **Product Ownership**: Evaluated every AI recommendation through the lens of delivery risk, user experience, and the 4–6 hour timebox.

---

## 3. Where AI Materially Accelerated the Work

1. **Full-Stack Scaffolding (Saved ~1–2 hours):**  
   Bootstrapped the SvelteKit project structure, Tiptap editor bindings, Tailwind-free semantic styling, and Supabase client lazy-initialization in minutes instead of manually reading fragmented setup documentation.
2. **Schema Translation From Spec (Saved ~45 mins):**  
   Converted the assignment requirements directly into a clean relational database schema (`users`, `documents`, `document_permissions`) using a join table from day one, allowing future role expansions (`viewer`, `commenter`) without schema migrations.
3. **Multi-Format File Parser Architecture (Saved ~1 hour):**  
   Drafted the unified client-side parsing pipeline in `upload.ts` utilizing `mammoth` for `.docx` and `marked` for `.md` and `.txt`, mapping them seamlessly into Tiptap's structured `JSONContent` format.
4. **Fast Infrastructure Debugging (Saved ~45 mins):**  
   Quickly diagnosed runtime issues on Vercel:
   - Identified that Vercel deprecated Node.js 20 in production containers and upgraded the project engines and SvelteKit adapter configuration to Node.js 24.
   - Identified that `supabase-js` eagerly instantiates WebSocket transport during server initialization and injected a lightweight `ws` polyfill for Node serverless functions.

---

## 4. What AI Output Was Challenged, Overridden, or Rejected

A central responsibility of a Technical Program & Project Manager in an AI-forward team is recognizing when AI recommendations increase project risk or deliver substandard UX. Key overrides included:

### A. Rejecting Complex Realtime Collaboration (Phase 1)
- **AI Proposal:** Suggested implementing live collaborative editing using Yjs and WebSockets early in the planning phase.
- **My Decision:** **Rejected.** Realtime CRDT/OT introduces distributed state synchronization, offline reconnection logic, and hosting complexity that easily balloons into multiple days of work. I cut this to prioritize rock-solid document CRUD, debounced autosaving, and verifiable sharing permissions within the 4–6 hour timebox.

### B. Pivoting from Third-Party Magic Links to Self-Managed Scrypt Auth (Phase 7.75)
- **AI Proposal:** Initially pushed for Supabase Auth (Magic Links and OTP email codes).
- **The Issue:** Supabase email templates, token formats (`{{ .Token }}` requirements), and redirect allow-lists introduced external configuration bottlenecks and testing friction.
- **My Decision:** **Overrode the AI.** When third-party auth created friction against our delivery deadline, I directed the implementation of a self-contained, lightweight authentication model directly inside `public.users`:
  - Password hashing with Node’s built-in `scrypt` (no external dependency risks).
  - Constant-time verification (`timingSafeEqual`) to mitigate timing attacks.
  - HttpOnly session cookies.
  - *Result:* 80 lines of clean, transparent code that we fully control, eliminating all third-party email configuration risks.

### C. Elevating Editor Fidelity Beyond Base StarterKit (Phase 7.5)
- **AI Proposal:** Relied on Tiptap's minimal `StarterKit` without extended table or styling modules.
- **My Decision:** Challenged the output when test `.docx` imports lost table formatting. I mandated the inclusion of `@tiptap/extension-table`, `@tiptap/extension-link`, and `@tiptap/extension-text-align`, unified under a single source of truth (`editorExtensions.ts`) shared by both the live editor and the import parser.

### D. Enforcing Dual-Location Title Renaming
- **AI Proposal:** Initially supported document renaming only from the home dashboard list.
- **My Decision:** Pushed back from a usability perspective. Real-world document editors must allow users to rename documents directly from the header while editing. Implemented synchronized title renaming across both views.

---

## 5. Verification & Quality Assurance Strategy

To ensure implementation reliability without sacrificing delivery speed, I applied a three-tiered verification methodology:

1. **Automated Cryptographic Unit Testing (`npm test`)**:  
   Built a Vitest suite targeting `src/lib/server/auth.ts`. Validated:
   - Password hashing round-trip correctness.
   - Rejection of incorrect passwords.
   - Detection of tampered hash payloads.
   - Graceful handling of malformed stored hashes.
   - Cryptographic salt uniqueness across invocations.
2. **Policy Access Verification**:  
   Manually audited the centralized authorization layer (`requireOwner` and `requireAccess` in `policy.ts`) across edge cases:
   - Owner access (create, rename, delete, grant access, revoke access).
   - Shared collaborator access (open, edit, autosave).
   - Non-collaborator access rejection (forced redirection / 403 response).
   - Unauthenticated visitor redirection to `/login`.
3. **Multi-Session Cross-Browser Testing**:  
   Conducted real-time sharing verification using two distinct browsers (Chrome and incognito window) signed into separate test accounts (`sanju@example.com` and `anil@example.com`), ensuring that permission mutations and updates propagate accurately.

---

## 6. Summary of Key Decisions (Decision Log)

| Phase | Proposal / Challenge | Decision & Rationale | Outcome |
|---|---|---|---|
| **Phase 1** | Scope & Stack Selection | Selected **SvelteKit + Tiptap v3 + Supabase Postgres**. Cut live multi-cursor CRDT. | Focused delivery on core usability and stability. |
| **Phase 2** | Database Schema Design | Designed `users`, `documents`, and `document_permissions` join table from day one. | Ready for role expansion (viewer/commenter) without database migration. |
| **Phase 4** | Document Renaming UX | Required inline renaming in dashboard list **and** in the document editor header. | Intuitive, familiar Google-Docs-style title editing. |
| **Phase 5** | Autosave Strategy | Implemented 800ms debounce with a `keepalive` flush on window navigation. | Prevents loss of user keystrokes on abrupt tab closures. |
| **Phase 7** | Multi-Format File Upload | Built client-side `.txt`, `.md`, and `.docx` parsing to Tiptap JSONContent. | Clean file-to-document conversion under 2 MB. |
| **Phase 7.5** | Editor Extension Sync | Extracted all extensions into `src/lib/editorExtensions.ts`. | Single source of truth for both live editor and import parser. |
| **Phase 7.75** | Auth Architecture Pivot | Replaced third-party Supabase magic-link auth with self-contained `scrypt` + session cookies. | Eliminated external email template friction; complete control over auth logic. |
| **Phase 8** | Vercel Deployment & Node 24 | Detected Node 20 deprecation on Vercel; upgraded project engines and adapter to Node 24. | Clean production deployment and reliable CI/CD build. |
