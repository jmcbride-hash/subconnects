# Deployment Guide

How to get SubConnects live on a preview URL today, with the production domain disconnected until you're ready.

---

## What you'll have when this is done

A `https://subconnects-<random>.vercel.app` URL that renders the marketing site, sign-up / sign-in forms, and onboarding flows. The landing page is fully functional. Auth and DB operations error gracefully until env vars are wired.

The production domain (subconnects.com) is **not touched** until you explicitly point DNS at Vercel later.

---

## Step 1 — Push to GitHub (3 minutes)

The repo is already initialized locally with a clean commit. You just need to create the remote and push.

**1a. Create a private GitHub repo:**

- Go to https://github.com/new
- Repository name: `subconnects`
- Visibility: **Private**
- Do NOT initialize with README / .gitignore / license (we already have all three)
- Click "Create repository"

**1b. Push from your terminal:**

```bash
cd /Users/jamesmcbride/Desktop/SubConnect

# Replace <your-username> with your GitHub username
git remote add origin git@github.com:<your-username>/subconnects.git

# If you don't have an SSH key set up, use HTTPS instead:
# git remote add origin https://github.com/<your-username>/subconnects.git

git push -u origin main
```

If you've never pushed to GitHub from this machine before, you may be prompted for credentials. If HTTPS, GitHub now requires a personal access token instead of a password — generate one at https://github.com/settings/tokens (scope: `repo`).

---

## Step 2 — Deploy to Vercel (2 minutes)

**2a. Sign in to Vercel:**

- Go to https://vercel.com
- Sign in with GitHub (uses your existing account, no separate password)
- On first sign-in, Vercel asks to install the GitHub app — grant access to the `subconnects` repo only

**2b. Import the project:**

- Click **Add New… → Project**
- Find the `subconnects` repo in the list, click **Import**
- Framework Preset: **Next.js** (auto-detected — don't change)
- Build Command: leave default (`next build`)
- Output Directory: leave default
- Install Command: leave default (`npm install`)
- Environment Variables: **leave empty for now** — we'll add them later
- Click **Deploy**

About 90 seconds later, Vercel will give you a URL like `https://subconnects-abc123.vercel.app`.

That's your preview deployment. Send it to your partner.

---

## What works in preview mode (no env vars)

| Route | Status |
|---|---|
| `/` (landing page) | ✅ Full marketing site |
| `/sign-up` | ✅ Form renders; submit will error (no Supabase yet) |
| `/sign-in` | ✅ Form renders; submit will error |
| `/onboard` | ✅ Role selector works |
| `/onboard/contractor` | ✅ Full form renders; submit will error |
| `/onboard/crew` | ✅ Full form renders with systems + references; submit will error |
| `/contractor`, `/sub`, `/admin` | ✅ Auth-gated — redirect to `/sign-in` |
| `/api/health` | ✅ Returns JSON |

What this means: anyone who clicks the preview URL sees the brand, reads the copy, walks through the forms, and confirms the visual + UX. Submitting actually creates an account is the only thing that won't work — and that's expected at preview stage.

---

## Step 3 (later) — Wire env vars for full functionality

Once you've reviewed the preview and want auth + DB + search to actually work, you'll set up:

**Supabase** (Postgres + Auth — 10 min):
1. Go to https://supabase.com → New Project
2. Project name: `subconnects-prod` (or `subconnects-staging` if you want a separate staging)
3. Database password: generate and save
4. Region: closest to where most users will be (us-east for Dallas)
5. After provisioning, go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to **Project Settings → Database** and copy the **Transaction pooler** URI → `DATABASE_URL` (use port 6543)
7. Also grab the **Direct connection** URI → `DIRECT_URL` (port 5432, for drizzle-kit migrations)

**Add the env vars to Vercel:**

- In your Vercel project: **Settings → Environment Variables**
- Add each variable, scope to **Production, Preview, and Development**
- Save

**Run migrations against Supabase:**

```bash
# Locally, put the DIRECT_URL in .env.local first:
cp .env.example .env.local
# Edit .env.local with your real values

# Then run:
npm run db:push   # quick dev approach — pushes schema directly
# OR
npm run db:migrate  # uses the generated migration files (production-safe)
```

**Trigger a redeploy on Vercel:**

```bash
# Easiest: push any commit
git commit --allow-empty -m "Trigger redeploy with env vars"
git push

# Or from the Vercel dashboard: Deployments → ⋯ → Redeploy
```

After redeploy, sign-up will actually create an account. The full flow works.

**To make yourself an admin** (after your first sign-up):

```sql
-- In Supabase SQL Editor:
UPDATE public.users SET is_platform_admin = true WHERE email = 'you@your-email.com';
```

Then `/admin` becomes accessible.

---

## Step 4 (much later) — Point subconnects.com at Vercel

When you're ready for production:

1. In Vercel: **Settings → Domains** → Add `subconnects.com`
2. Vercel shows you DNS records to add at your registrar
3. Update your DNS at the registrar (where you bought subconnects.com)
4. Wait ~5 min for DNS to propagate
5. Done. The same preview deployment now also serves at subconnects.com

---

## Auto-deploys on every commit

Vercel watches the `main` branch by default. Every `git push origin main` triggers a fresh production deploy. Every push to any other branch (or PR) creates a preview deploy with its own URL — perfect for showing your partner a specific change before merging.

To disable auto-deploys (e.g., during a quiet period), Settings → Git → Production Branch → toggle.

---

## Troubleshooting

**Push fails with "Permission denied (publickey)":**
You don't have an SSH key set up for GitHub. Switch to HTTPS:
```bash
git remote set-url origin https://github.com/<your-username>/subconnects.git
git push -u origin main
```

**Vercel build fails:**
Check the Build Logs in Vercel. Most common causes:
- Node version mismatch — set Node to 20.x in Settings → General → Node.js Version
- Missing env var that's required at build time (unlikely with our setup; we made everything lazy)

**Preview URL shows a 500 on the marketing page:**
Shouldn't happen — the marketing page is static. If it does, check the Vercel build logs.

**Forms submit and silently fail:**
Expected without env vars. Once Supabase is wired, this resolves.
