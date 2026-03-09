# HomePilot — Setup Guide

## Prerequisites
- Node.js 20+ (use `nvm install 20`)
- A [Supabase](https://supabase.com) account
- An [Anthropic](https://console.anthropic.com) account
- A [Vercel](https://vercel.com) account

---

## 1. Supabase Setup

### Create a project
1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Note your **service_role key** (Settings → API → Service Role — keep secret!)

### Run the schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `database/schema.sql` and run it
3. Paste the contents of `database/seed.sql` and run it (optional seed data)

### Create Supabase Storage bucket
1. Go to **Storage** → New bucket
2. Name: `chore-photos`
3. Set to **Private** (auth required to read)
4. Add an RLS policy: allow authenticated users to insert/read their own household's files

---

## 2. Environment Variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIdNORzL-oG6K6ZPpR71trLIyjHc_WzMEeOqZvQiMNFssBFXiliXdVmmcYkv-LxGZAz6B6RzrxHVBlrLUba2Th8
VAPID_PRIVATE_KEY=dnHLtp4rfVKy4taHKYKXCDjyB6MgyL7rzNRcvbLQqgs
VAPID_SUBJECT=mailto:mmd.lim@gmail.com
CRON_SECRET=<generate a random 32-char string>
```

> The VAPID keys are pre-generated and ready to use. Do not regenerate them — the helper's browser subscription would break.

---

## 3. Local Development

```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

---

## 4. Deploy to Vercel

### Initial deploy
```bash
npm install -g vercel
vercel
```

### Add environment variables in Vercel
Go to your project → Settings → Environment Variables and add all variables from `.env.local`.

**Important**: `CRON_SECRET` must match exactly in both `.env.local` (local) and Vercel (production).

### Cron job
The `vercel.json` file already configures a daily cron at 6:25am Singapore time (22:25 UTC):

```json
{"crons": [{"path": "/api/cron/morning-push", "schedule": "25 22 * * *"}]}
```

Vercel automatically calls this endpoint with `Authorization: Bearer <CRON_SECRET>`.

---

## 5. First Time Setup (After Deploy)

1. **Go to `/login`** → create your admin account via Supabase Auth dashboard first (or use the onboarding wizard at `/onboarding`)
2. **Run onboarding** at `/onboarding` — this seeds default chores and recipes for your household
3. **Create helper account** in Settings → Helper tab → "Create Helper Account"
4. **Give helper the URL** and have them open it on Android Chrome → tap "Add to Home Screen"
5. **Helper enables push notifications** when prompted in the app

---

## 6. Android PWA Install (Helper)

1. Open the app URL in Chrome on Android
2. Tap the menu (⋮) → "Add to Home Screen"
3. The app installs like a native app
4. On first open, tap "Enable" when prompted for notifications

---

## 7. Supabase Auth Setup

In your Supabase project:
1. Go to **Authentication → Providers** → ensure Email is enabled
2. Go to **Authentication → URL Configuration** → set Site URL to your Vercel domain
3. Optionally disable "Confirm email" for easier testing

---

## 8. Key URLs

| Route | Who | Purpose |
|-------|-----|---------|
| `/login` | Everyone | Login page |
| `/onboarding` | Admin (first time) | Setup wizard |
| `/admin` | Admin | Dashboard |
| `/admin/chores` | Admin | Manage chore schedule |
| `/admin/instructions` | Admin | Send ad-hoc instructions |
| `/admin/meal-plan` | Admin | Weekly meal planning |
| `/admin/grocery` | Admin | Grocery list |
| `/admin/photos` | Admin | Review chore photos |
| `/admin/settings` | Admin | Household settings |
| `/helper` | Helper | Today's checklist |
| `/helper/instructions` | Helper | Received instructions |
| `/helper/pantry-check` | Helper | Friday pantry check form |

---

## 9. Troubleshooting

**Push notifications not working?**
- Check `NEXT_PUBLIC_VAPID_PUBLIC_KEY` matches `VAPID_PRIVATE_KEY` — they were generated together
- Helper must be on HTTPS (push requires secure origin)
- Check Supabase `push_subscriptions` table has a row for the helper

**Translation not working?**
- Check `ANTHROPIC_API_KEY` is valid
- Check `SUPABASE_SERVICE_ROLE_KEY` (not anon key) is set — needed to write to translations cache

**Cron not firing?**
- Check Vercel → Functions → Cron Jobs tab
- Verify `CRON_SECRET` matches in Vercel env vars
