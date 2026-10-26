# SWAPDO

A rental marketplace for authorized AI tools, licensed entertainment and creator services, with time-based access (1 hour → 1 year) and memberships.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion · Prisma 6 · PostgreSQL · Zod · Vitest · Playwright (dev checks)

## Quick start

```bash
cp .env.example .env              # then fill in DATABASE_URL and the secrets
npm install                       # also runs `prisma generate`
npm run db:deploy                 # apply migrations
npm run db:seed                   # demo catalogue + demo accounts (wipes data)
npm run dev                       # http://localhost:3000
```

Demo accounts (password `SwapdoDemo2026`; one-click buttons appear on the sign-in page when `DEMO_MODE=true` or in development):
`user@swapdo.dev` (Pro member) · `seller@swapdo.dev` (Northwind Software) · `admin@swapdo.dev`

| Command | Purpose |
| --- | --- |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm test` | Unit and integration tests. Needs a Postgres database whose name ends in `_test` (`TEST_DATABASE_URL`); tables are truncated on every run |

## What's implemented, simulated, or needs credentials

**Implemented and tested**
- Landing page, marketplace (search, category/price/duration/verified filters, sorting), service detail pages, provider profiles, memberships, the "Sell on SWAPDO" application, help, legal and contact pages
- Auth: bcrypt passwords, DB-backed sessions in HTTP-only `SameSite=Lax` cookies, rate limiting, same-origin (CSRF) checks, role-based access on every page and API route
- **Rental engine** (`src/lib/rentals`)
  - Start and end times are set and checked only on the server; the countdown on screen just mirrors the server clock.
  - Activation is a conditional update, so it happens at most once per order.
  - Capacity checks lock the service row, so concurrent activations can't overbook.
  - Extensions use one atomic SQL statement that stacks on remaining time.
  - Usage limits are enforced inside the same UPDATE, so they hold under concurrency.
  - Expiry is saved lazily on access and also by a cron sweep.
  - Access is granted through short-lived HMAC grants.
- **Payments** (`src/lib/payments`)
  - A provider abstraction with signature-verified webhooks.
  - Idempotency by provider event ID.
  - Prices are computed on the server, and the paid amount is checked against the expected amount.
  - Credits are held at checkout and released if payment fails or the order is cancelled.
  - Failed payments can be retried; refunds reverse the seller's commission.
- **Subscriptions:**
  - Monthly and annual billing.
  - Prorated upgrades; downgrades and cancellations take effect at period end.
  - A renewal engine with past-due status and grace periods, then a drop to Free.
  - Entitlements (discounts, concurrent-rental limits, credits) enforced at checkout.
- Customer dashboard, seller studio (listings, moderation status, pricing, orders, commissions, payouts, support) and admin console:
  - Users, sellers, listings, rentals, subscriptions
  - Payments, refunds and payouts
  - Promo codes, categories, support, fraud flags and the audit log
  - Feature flags, commission settings, and membership pricing editable in the database
- SEO (metadata, Open Graph image, sitemap, robots, JSON-LD); private areas are `noindex`. Security headers, reduced-motion support, keyboard-accessible dialogs and menus, mobile-first layouts.

**Demo / simulated (clearly labelled in the UI)**
- Every provider, service, authorization and review in the seed data is fictional (`isDemo`). "Launch" on a demo rental issues a real server-checked access grant, but there is no real third-party service behind it.
- Payments use the **sandbox provider** (`PAYMENT_PROVIDER=mock`). It signs webhooks exactly as a gateway would and sends them through the production webhook handler. No money moves; invoices are marked sandbox.
- Payouts are "marked paid" with no bank transfer. Recurring renewals in sandbox succeed unless "fail next renewal" is switched on.
- Legal pages are templates and must be reviewed by counsel.

**Needs external credentials, licensing, or infrastructure**
- **Razorpay:** the adapter (order creation, Checkout, signature checks, webhooks, refunds) is written but **has not been run against real keys**. It needs an approved merchant account, `PAYMENT_PROVIDER=razorpay`, the `RAZORPAY_*` env vars, and the webhook URL `/api/webhooks/razorpay`. Automatic recurring charges need Razorpay Subscriptions or mandates, which aren't implemented.
- **Real provider integrations:** each real listing needs that provider's official API, OAuth or token integration, plus a valid authorization or licence. SWAPDO never requests or stores third-party passwords.
- **Scheduled jobs:** call `POST /api/cron/expire` and `POST /api/cron/billing` with `Authorization: Bearer $CRON_SECRET` (for example every 5 minutes and every hour).
- **Multiple instances:** the rate limiter is in-memory, so swap it for Redis or an edge limiter.
- Email delivery and file uploads for verification documents (sellers currently provide a document link).

## Layout

```
prisma/            schema, migrations, seed
src/config/        site, durations, default plans/flags/settings
src/data/          demo catalogue, legal copy
src/lib/           auth, rentals, subscriptions, payments, pricing, catalog, validation
src/app/(site)/    public pages · (auth)/ sign-in · dashboard/ · seller/ · admin/ · api/
src/components/    ui/ (design system), marketing/, marketplace/, dashboard/, seller/, admin/
tests/             engine, pricing, signatures, rental/subscription integration (concurrency)
```
