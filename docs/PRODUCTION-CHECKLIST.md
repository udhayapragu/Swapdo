# SWAPDO production checklist

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres **direct (non-pooled)** connection string. The build fails without it. |
| `APP_URL` | Yes | The live URL, e.g. `https://swapdo.vercel.app` (links, sitemap, OG image). |
| `SEED_PASSWORD` | Production, unless `DEMO_MODE=true` | Password for `admin@swapdo.dev`. Needed when the production database is first seeded, or while the admin still has the README demo password; the build fails without it then. |
| `PAYMENT_PROVIDER` | Yes | `mock` until Razorpay is approved, then `razorpay`. |
| `MOCK_WEBHOOK_SECRET` | Yes (mock) | Long random string. Without it a public fallback secret is used. |
| `ACCESS_GRANT_SECRET` | Yes | Long random string. Signs rental access tokens. |
| `CRON_SECRET` | Yes | Long random string. Vercel Cron sends it automatically to `/api/cron/*`. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Only with `PAYMENT_PROVIDER=razorpay` | From the Razorpay dashboard. |
| `DEMO_MODE` | No | `false` on a real site. `true` shows one-click demo logins; leave `SEED_PASSWORD` unset then, since the buttons use the README password. |

Generate each secret with `openssl rand -base64 32`, a different value for each.

## 2. What happens on deploy

Vercel runs `npm run vercel-build`: migrations (`prisma/migrate-deploy.mjs`) → seed **only if the database is empty** → remove demo data on production → `next build`.

- On **production** (without `DEMO_MODE=true`) the seed creates only membership plans, settings, categories and `admin@swapdo.dev`. Any demo listings, demo sellers and seeded `@swapdo.dev` accounts already in the database are deleted (`prisma/remove-demo.ts`), and a demo admin password is replaced with `SEED_PASSWORD`. Real listings and accounts are never touched.
- **Preview** deploys and local development keep the full demo catalog.
- Migrations always use Neon's direct host, even if `DATABASE_URL` is the `-pooler` one, or `DIRECT_URL` when set. If another deploy holds the migration lock (Prisma `P1002`), the build waits and retries up to 4 times instead of failing.

## 3. Scheduled jobs

`vercel.json` runs `/api/cron/expire` daily at 00:00 UTC and `/api/cron/billing` at 00:30 UTC. Rental access is already checked against `endsAt` on every request, so the daily expiry job only tidies statuses. The Hobby plan allows one run per day per job; on Pro you can make expiry hourly (`0 * * * *`).

## 4. Before real customers use it

- Sign in as `admin@swapdo.dev` with your `SEED_PASSWORD`, or create your own admin.
- The marketplace starts empty ("New listings are on their way") until you approve real sellers and listings.
- Keep Razorpay off until the merchant account is approved.

## 5. Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL etc.
npm install
npm run db:deploy && npm run db:seed
npm run build && npm start   # http://localhost:3000
```
