# Project Guardrails: Ajaia Take-Home

**Candidate:** Sanjushree Golla  
**Role:** Technical Program & Project Manager, AI Delivery  
**Company:** Ajaia LLC  

> Source spec: `ASSIGNMENT.md` | Master plan: `Plan.md` | Live status: `Progress.md`

---

## 1. Core Evaluation Criteria (From Ajaia Spec)

- **Timebox:** 4–6 hours total. ("A focused, well-reasoned partial solution is better than an overextended build.")
- **Zero Cost for Reviewers:** Must not require any paid subscription or proprietary dependency.
- **Full Stack Execution:** Seamless delivery across frontend, editor, server actions, persistence, and access logic.
- **Product Judgment:** Making conscious, well-reasoned scope cuts and communicating tradeoffs with clarity.
- **Mature AI Utilization:** Practical engineering velocity without outsourcing technical rigor or design judgment.

---

## 2. Required Scope & Deliverables

1. **Document CRUD & Formatting:** Create, edit, rename, save, reopen, and delete. Rich-text formatting (bold, italic, underline, headings, lists, tables).
2. **File Upload Workflow:** Direct client-side import for `.txt`, `.md`, and `.docx` into editable document drafts (max 2 MB).
3. **Sharing Model:** Document owner, permission granting/revoking, distinct dashboard views ("Your documents" vs. "Shared with you").
4. **Persistence:** Hosted Supabase Postgres with JSONB content storage; zero-config SQLite offline fallback for local mode.
5. **Quality & Security:** Self-contained email + password authentication with cryptographic `scrypt` hashing, input validation, and automated unit testing (`npm test`).
6. **Documentation Package:**
   - [`README.md`](./README.md): Setup, configuration, and run guide.
   - [`SUBMISSION.md`](./SUBMISSION.md): Submission manifest, live URLs, and test credentials.
   - [`ARCHITECTURE.md`](./ARCHITECTURE.md): System architecture, tradeoffs, security, and roadmap.
   - [`AI_WORKFLOW.md`](./AI_WORKFLOW.md): AI-native workflow reflection and decision log.

---

## 3. Deliberate Scope Cuts

To maintain high fidelity within the 4–6 hour boundary, the following are explicitly out of scope:
- Live multi-cursor collaborative editing (CRDT/OT).
- Comment threads and suggested changes mode.
- Local disk image uploads to cloud storage buckets (embedded `.docx` images are preserved as data URIs).
- Forgot-password email reset service (prioritized rock-solid self-managed scrypt auth).

---

## 4. Architectural Rules

- **Thin Repository Layer:** Only `src/lib/server/db/*` interacts with Supabase or SQLite.
- **Structured Content:** Document contents are stored exclusively as Tiptap `JSONContent` trees in JSONB columns, never unescaped HTML strings.
- **Normalized Join Tables:** Document permissions are modeled in `document_permissions` from day one.
- **Centralized Policy Enforcement:** All mutations pass through `policy.ts` (`requireOwner` or `requireAccess`).
- **Autosave Reliability:** Debounced at 800ms with a `keepalive: true` unmount flush on page navigation.
