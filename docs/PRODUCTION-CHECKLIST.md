# SWAPDO production checklist

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres **direct (non-pooled)** connection string. The build fails without it. |
| `APP_URL` | Yes | The live URL, e.g. `https://swapdo.vercel.app` (links, sitemap, OG image). |
| `SEED_PASSWORD` | First production deploy, unless `DEMO_MODE=true` | Password for the seeded `admin@`, `seller@` and `user@swapdo.dev` accounts. The build fails without it. |
| `PAYMENT_PROVIDER` | Yes | `mock` until Razorpay is approved, then `razorpay`. |
| `MOCK_WEBHOOK_SECRET` | Yes (mock) | Long random string. Without it a public fallback secret is used. |
| `ACCESS_GRANT_SECRET` | Yes | Long random string. Signs rental access tokens. |
| `CRON_SECRET` | Yes | Long random string. Vercel Cron sends it automatically to `/api/cron/*`. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Only with `PAYMENT_PROVIDER=razorpay` | From the Razorpay dashboard. |
| `DEMO_MODE` | No | `false` on a real site. `true` shows one-click demo logins; leave `SEED_PASSWORD` unset then, since the buttons use the README password. |

Generate each secret with `openssl rand -base64 32`, a different value for each.

## 2. What happens on deploy

Vercel runs `npm run vercel-build`: `prisma migrate deploy` → seed demo data **only if the database is empty** → `next build`. Redeploys never wipe data.

## 3. Scheduled jobs

`vercel.json` runs `/api/cron/expire` daily at 00:00 UTC and `/api/cron/billing` at 00:30 UTC. Rental access is already checked against `endsAt` on every request, so the daily expiry job only tidies statuses. The Hobby plan allows one run per day per job; on Pro you can make expiry hourly (`0 * * * *`).

## 4. Before real customers use it

- Sign in as `admin@swapdo.dev` with your `SEED_PASSWORD` and change it, or create your own admin.
- The catalog is demo data (marked "Demo"). Replace it with real sellers and listings.
- Keep Razorpay off until the merchant account is approved.

## 5. Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL etc.
npm install
npm run db:deploy && npm run db:seed
npm run build && npm start   # http://localhost:3000
```
