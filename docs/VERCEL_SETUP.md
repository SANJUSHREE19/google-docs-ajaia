# Vercel Setup

> Detailed deploy instructions live in Phase 8. This doc covers the **2-minute prep work** you can do now, in parallel.

## Prep now (Phase 2)

1. Go to https://vercel.com → **Sign Up** → use **Continue with GitHub** (this is the fastest path; Vercel auto-detects pushed repos).
2. Authorize Vercel to access your repos. You can scope it to "Only select repositories" — fine to add the repo later.
3. That's it for now. Don't import any project yet — we deploy in Phase 8.

## Phase 8 deploy steps (preview, do not run yet)

When the app is finished:

1. Push the repo to GitHub.
2. Vercel dashboard → **Add New** → **Project** → import the GitHub repo.
3. Framework preset: **SvelteKit** (Vercel auto-detects).
4. Environment variables — add these two (values from Supabase, "New keys" tab):
   - `PUBLIC_SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (mark as **Sensitive**)
5. Click **Deploy**. First deploy takes ~2 minutes.
6. Copy the production URL (e.g. `google-docs-ajaia-cx5tdq6yq-sanju-6cf3.vercel.app`).
7. Do a smoke test — switch user, create a doc, share with another user.

## Notes

- We use `@sveltejs/adapter-auto`, which auto-detects Vercel and uses `adapter-vercel` at build time. No config to change.
- Cold starts on Vercel free tier are ~1–2 seconds. Acceptable for the take-home.
- Free tier limits (100 GB-hours / month) are far above what this assignment will use.
