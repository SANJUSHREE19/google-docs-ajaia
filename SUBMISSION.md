# Submission: Lightweight Collaborative Document Editor

**Candidate:** Sanjushree Golla  
**Role:** Technical Program & Project Manager, AI Delivery  
**Company:** Ajaia LLC  

---

## Live Links & Repositories

- **Production Live URL:** https://google-docs-ajaia-cx5tdq6yq-sanju-6cf3.vercel.app/login  
  *(Visiting redirects to `/login` if not signed in — you can sign in with test accounts or sign up fresh).*
- **GitHub Repository:** https://github.com/SANJUSHREE19/google-docs-ajaia  
- **Walkthrough Video:** `[INSERT YOUR 3-5 MIN LOOM OR YOUTUBE VIDEO LINK HERE]`  
  *The video covers: main user flow, end-to-end functionality, intentional scope cuts, key engineering choices, and how AI supported the delivery.*

---

## Test Accounts

Pre-seeded accounts configured for quick evaluation of document collaboration and sharing:

| Name | Email | Password | Role / Purpose |
|---|---|---|---|
| **Sanju** | `sanju@example.com` | `password123` | Primary Document Owner |
| **Anil** | `anil@example.com` | `password123` | Collaborator (Shared Editor) |
| **Raju** | `raju@example.com` | `password123` | Secondary Collaborator |

**How to test sharing:**
1. Sign in as `sanju@example.com` in your browser.
2. Create or open a document, click the **Share** button in the header, and grant access to `anil@example.com`.
3. Open an incognito / private browser window, sign in as `anil@example.com`, and verify that the document appears under **"Shared with you"** and can be edited concurrently.

*Alternatively, click **"Sign up"** at the bottom of `/login` to register any custom email and password (minimum 8 characters).*

---

## What's Included in This Submission

| Deliverable | Location | Description |
|---|---|---|
| **Source Code** | `/src`, `/static`, config files | Full-stack SvelteKit application with Tiptap v3 and Supabase |
| **Setup & Run Instructions** | [`README.md`](./README.md) | Local development setup, SQLite fallback, and test execution |
| **Architecture Note** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System design, stack rationale, security policy, and tradeoff analysis |
| **AI-Native Workflow Note** | [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) | AI tools utilized, acceleration areas, rejected code, and verification |
| **Submission Manifest** | [`SUBMISSION.md`](./SUBMISSION.md) | This file: URLs, credentials, scope summary, and roadmap |
| **Master Scope Plan** | [`Plan.md`](./Plan.md) | 8-phase execution plan with explicit scope boundaries |
| **Progress Tracker** | [`Progress.md`](./Progress.md) | Milestone exit gates and manual testing verification log |
| **Database Walkthrough** | [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) | Database schema DDL, triggers, and configuration |
| **Deployment Guide** | [`docs/VERCEL_SETUP.md`](./docs/VERCEL_SETUP.md) | Vercel production hosting and environment configuration |

---

## Automated Tests

Run the test suite:

```bash
npm test
```

- **Test Target:** `src/lib/server/auth.test.ts`
- **Coverage:** Cryptographic password hashing round-trip, incorrect password rejection, tampered hash detection, malformed hash safety handling, and unique salt generation.
- **Result:** 5 automated unit test cases passing in <1s.

---

## What Is Working (Full End-to-End Execution)

- **Document CRUD & Renaming:** Create new documents, edit, save, reopen, and delete. Real-time title renaming is supported both inline from the dashboard list and directly inside the document editor header.
- **Rich-Text Formatting:** Powered by Tiptap v3: bold, italic, underline, strikethrough, headings (H1–H3), bulleted and numbered lists, alignment (left/center/right), hyperlinking, contextual tables (add/remove rows and columns), and image rendering.
- **File Upload & Import:** Client-side parsing of `.txt`, `.md`, and `.docx` files (up to 2 MB) via `marked` and `mammoth`. Automatically converts uploaded file structure and formatting into a new editable document draft.
- **Sharing & Access Control:** Document owners can share edit access with any registered user or revoke access at any time. The home dashboard explicitly separates **"Your documents"** from **"Shared with you"** documents.
- **Centralized Security Layer:** Server-enforced authorization policies (`requireOwner` and `requireAccess` in `policy.ts`) ensure non-owners cannot mutate titles, permissions, or delete documents.
- **Reliable Persistence & Autosave:** Documents are stored as structured JSONB in Supabase Postgres. Content autosaves with an 800ms debounce while typing, accompanied by a `keepalive` flush when navigating away.
- **Production Deployment:** Live on Vercel with Node.js 24 runtime, environment variable isolation, and automated CI/CD from GitHub.

---

## What Was Intentionally Deprioritized (Tradeoffs)

1. **Live Multi-Cursor Realtime Collaboration (CRDT / Operational Transformation):**  
   *Decision:* Implementing Yjs or Hocuspocus for live character-by-character presence indicators would have consumed days of effort and risked core stability within the 4–6 hour timebox. Deprioritized in favor of robust autosaving, reliable server-side persistence, and bulletproof document CRUD.
2. **Direct Image Uploads to Cloud Storage:**  
   *Decision:* We support images embedded inside uploaded `.docx` documents (rendered cleanly as data URIs), but cut an "Upload Image from Disk" button to avoid expanding scope into cloud object storage buckets (S3 / Supabase Storage).
3. **Forgot-Password Email Reset Tokens:**  
   *Decision:* Self-managed authentication was chosen to avoid dependency on third-party email delivery latency and configuration issues. Shipped sign-up and sign-in with scrypt password hashing; single-use email reset tokens are slated for the next iteration.

---

## What I'd Build With 2–4 More Hours

1. **Real-Time Active Viewer Presence (45–60 min):** Connect a Supabase Realtime presence channel to display active collaborator avatars in the document header when multiple users view the same document.
2. **Policy Layer Unit Tests (30–45 min):** Add mock tests for `requireAccess` and `requireOwner` to verify authorization edge cases automatically in CI.
3. **Markdown / Document Export (30 min):** Add a client-side "Download as Markdown / HTML" button to export editor content.

---

## Notes for the Reviewer

- **Supabase Free Tier:** Hosted database instances pause after ~7 days of inactivity. If the live URL experiences a brief 2–3 second delay on first load, Postgres is restoring from idle state.
- **Local Development Fallback:** If run locally without Supabase environment variables, the codebase automatically switches to an internal SQLite engine (`.data/local.sqlite`), allowing complete offline evaluation without external credentials.
