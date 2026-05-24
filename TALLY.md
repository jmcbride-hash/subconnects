# Tally Forms Setup

How to spin up the two waitlist forms and wire them into the site without writing any code.

The site already has the embed component built. You just create the forms in Tally, grab two IDs, paste them into Vercel as env vars, redeploy. About 20 minutes total.

---

## Step 1 — Create a Tally account (2 min)

1. Go to https://tally.so
2. Sign up with email or Google
3. Free plan is fine — it covers unlimited forms and unlimited submissions

---

## Step 2 — Create the Contractor Waitlist form (8 min)

In Tally, click **Create new form → Start from scratch**.

Form title: **Join the Contractor Waitlist**

Add these fields in order. Field types in **bold**; required marked with ⚠️.

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Company name | **Short answer** | ⚠️ | Placeholder: "Acme Roofing" |
| 2 | Work email | **Email** | ⚠️ | |
| 3 | Phone | **Phone number** | optional | |
| 4 | Metro you operate in | **Multiple choice** | ⚠️ | Options: Dallas-Fort Worth, Atlanta, Phoenix, Other (text) |
| 5 | Commercial roofing jobs per year | **Multiple choice** | ⚠️ | Options: Under 10, 10–50, 50–200, 200+ |
| 6 | Biggest pain point sourcing crews today | **Long answer** | optional | |

**Settings to flip on (Settings panel, left sidebar):**

- **Notifications** → "Send me an email on every submission" → On, with your address
- **Thank you page** → custom message: "Thanks. We'll reach out within 1 business day."
- **Form appearance**:
  - Theme: pick the dark theme to match (or leave default — the embed inherits our brand colors anyway)
  - Hide "Made with Tally" — paid feature, skip for now

**Publish** the form (top-right button).

**Grab the form ID:**
- Click **Share** (top-right)
- Click the **Embed** tab
- Look at the embed code — the URL has the form ID. Example: `https://tally.so/embed/wMpEYO?...` → ID is **`wMpEYO`**
- Or look at the form URL: `https://tally.so/r/wMpEYO` → same ID

Save that ID somewhere. You'll paste it into Vercel in step 4.

---

## Step 3 — Create the Crew Waitlist form (8 min)

Click **Create new form → Start from scratch**.

Form title: **Join the Crew Waitlist**

| # | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Crew or company name | **Short answer** | ⚠️ | Placeholder: "Lone Star Roofing Crews" |
| 2 | Your name and role | **Short answer** | ⚠️ | Placeholder: "Mike Torres, Foreman" |
| 3 | Work email | **Email** | ⚠️ | |
| 4 | Phone | **Phone number** | optional | |
| 5 | Base city / metro | **Short answer** | ⚠️ | Placeholder: "Fort Worth, TX" |
| 6 | Systems you work on | **Checkboxes** | ⚠️ | Options: TPO, EPDM, PVC, Modified Bitumen, BUR (Built-Up Roof), Standing Seam Metal, Exposed Fastener Metal, Asphalt Shingle, Slate, Tile, Coatings, Spray Polyurethane Foam |
| 7 | Years in the trade | **Multiple choice** | ⚠️ | Options: Under 2, 2–5, 5–10, 10+ |
| 8 | Crew size | **Multiple choice** | ⚠️ | Options: 1–3, 4–8, 9–15, 16+ |

Same Settings as before (notifications + thank-you page).

**Publish** → **Share → Embed** → grab the form ID. Save it.

---

## Step 4 — Wire the form IDs into Vercel (3 min)

1. Go to https://vercel.com/jmcbride-2318s-projects/subconnects/settings/environment-variables
2. Click **Add New**
3. Add the first variable:
   - **Key:** `NEXT_PUBLIC_TALLY_CONTRACTOR_FORM_ID`
   - **Value:** paste the contractor form ID from step 2 (e.g., `wMpEYO`)
   - **Environment:** check **Production**, **Preview**, and **Development**
   - **Save**
4. Add the second variable:
   - **Key:** `NEXT_PUBLIC_TALLY_CREW_FORM_ID`
   - **Value:** paste the crew form ID from step 3
   - **Environment:** check all three
   - **Save**

---

## Step 5 — Redeploy to pick up the new env vars (1 min)

Two ways:

**Option A — Push any commit** (if your Vercel ↔ GitHub hook is set up):
```bash
cd /Users/jamesmcbride/Desktop/SubConnect
git commit --allow-empty -m "Enable Tally waitlist forms"
git push
```

**Option B — Redeploy from the Vercel dashboard:**
1. https://vercel.com/jmcbride-2318s-projects/subconnects/deployments
2. Find the latest production deployment → click the **⋯** menu → **Redeploy**
3. Confirm

About 90 seconds later the live site shows the real forms instead of the placeholder.

---

## Step 6 — Test the forms

1. Open https://subconnects-e16bn54bg-jmcbride-2318s-projects.vercel.app/for-contractors
2. Scroll to the waitlist form
3. Fill it in with test data, submit
4. You should get a notification email
5. Submissions appear in Tally → your form → **Submissions** tab

Repeat for `/for-crews`.

---

## Notes

**Submissions live in Tally** for now. When we wire Supabase, the same forms can post directly to our `subscriptions` / `waitlist_*` tables instead (or we leave them in Tally and import them into our CRM). Don't worry about that yet — Tally is the right home for waitlist data at Stage 0.

**The forms inherit our brand colors and fonts automatically** through the iframe's transparent background. They render inline on the page, not as a popup, so the visitor stays on the SubConnects site through the submit action.

**If a form ID isn't set,** the page falls back to the placeholder block (the dashed-border one) so the site never breaks during setup.

**To change the fields later,** just edit the form in Tally — the site picks up the change instantly. No redeploy needed for form changes.
