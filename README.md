# SVU Campus Explorer — Pilot (Exploration Mode only)

Next.js app implementing the Exploration Mode gamification loop from the
project brief: geo-tagged location visits, quiz-gated shards, hidden-quantity
gem assignment, Joker wildcards, prize recipes, and code-based redemption.

## Stack
- **Next.js (App Router, TypeScript)** — frontend + API routes in one project
- **Supabase (Postgres)** — database
- **Vercel** — hosting (recommended, zero-config for Next.js)

## 1. Create your Supabase project
1. Go to supabase.com → New project.
2. Once it's ready, open the **SQL Editor** and run the contents of
   `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (⚠️ keep this private, never expose to the browser)

## 2. Configure environment variables
```
cp .env.example .env
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from step 1
- `SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
- `STAFF_PASSCODE` — whatever the prize-desk staff will type in to verify codes

## 3. Install & seed content
```
npm install
npm run seed
```
This reads everything in `content/*.csv` (locations, quiz questions, prize
recipes, categories, and pre-set student accounts) and syncs it into
Supabase. **Re-run `npm run seed` any time you edit a CSV** — it's safe to
run repeatedly (upserts, not inserts).

All the content right now is placeholder text — swap it out:
- `content/locations.csv` — name, coordinates, "did you know" fact, info text, media links
- `content/quiz_questions.csv` — add a row per location to override the
  auto-generated placeholder question; any location left out just gets a
  generic placeholder question so the app stays click-through-able
- `content/prizes.csv` — prize name + recipe (gem type → count needed), as JSON
- `content/students.csv` — pre-set student ID + password pairs

### Editing content from a spreadsheet instead of CSV files
If you'd rather your team edit locations/quiz/prizes in Google Sheets:
1. Recreate the same columns as the matching CSV in a Sheet tab.
2. File → Share → **Publish to web** → select that tab → CSV.
3. Paste the published URL into `.env` as e.g. `LOCATIONS_CSV_URL=...`.
4. `npm run seed` will now pull from the sheet instead of the local file —
   no code changes needed.

## 4. Run locally
```
npm run dev
```
Open http://localhost:3000. Note: geo-tagging uses the browser's
`navigator.geolocation`, which most browsers only allow over **HTTPS or
localhost** — fine for local dev, but once deployed it'll work automatically
since Vercel serves everything over HTTPS.

## 5. Deploy
Push this repo to GitHub, then import it in Vercel and add the same
environment variables from `.env` in the Vercel project settings. Vercel
auto-detects Next.js — no build config needed.

## How the core mechanics map to code
- **Hidden-quantity gem assignment** (`src/lib/gemAssignment.ts`) — the
  first time a student opens a category, the app randomly picks which
  locations will award a gem (respecting each category's configured pool
  size) and stores that assignment so it stays stable for that student.
  Nothing about it is exposed to the frontend until they actually pass the
  quiz at a winning location.
- **Proximity verification** (`src/lib/geo.ts`) — plain Haversine distance
  between the phone's reported GPS coordinates and the location's stored
  lat/lng, checked against each location's `proximity_radius_m`.
- **Sequencing gate** (`src/lib/progress.ts`) — Institute Tour and Campus
  History are marked `is_gate = true`; every other category's
  `/api/categories/.../locations` route checks server-side (not just hidden
  in the UI) that both are fully complete before it'll return that
  category's content.
- **Joker wildcards & prize matching** (`src/lib/gems.ts`) — `matchRecipe()`
  computes per-gem-type progress toward a prize and how many spare Jokers
  would be needed to cover any shortfall.
- **Redemption codes** (`/api/prizes/[id]/redeem`) — consumes the gems,
  generates a 6-character code, and stores it as `issued`. The **staff page**
  at `/staff` (passcode-protected) looks up a code and flips it to `claimed`
  so it can't be reused.

## What's still a placeholder / needs a decision
- All location info, photos, quiz questions, and prize art are placeholders.
- Home screen currently uses the "normal progress bar" version rather than
  the grayed-out map version — let me know if you want the map version built.
- No student self-signup, per your instruction — accounts are pre-seeded
  via `content/students.csv`.
- Staff verification is passcode-only for now; can be swapped for a
  QR-scan flow if you'd prefer that at the handoff table.
