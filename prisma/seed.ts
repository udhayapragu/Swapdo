import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { DEMO_CATEGORIES, DEMO_SELLERS, DEMO_SERVICES, demoReviewsFor } from "../src/data/demo-catalog";
import { DEFAULT_FEATURE_FLAGS, DEFAULT_MEMBERSHIP_PLANS, DEFAULT_PLATFORM_SETTINGS } from "../src/config/membership-plans";

const db = new PrismaClient();
// One-click demo logins (DEMO_MODE=true) use this password, so leave SEED_PASSWORD unset on demo deployments.
const DEMO_PASSWORD = "SwapdoDemo2026";
const SEED_PASSWORD = process.env.SEED_PASSWORD || DEMO_PASSWORD;
// Every Vercel deploy (production and preview) starts with platform config, categories and one admin, never the
// demo catalog. Local development keeps it.
const LIVE_SITE = process.env.VERCEL === "1" && process.env.DEMO_MODE !== "true";
const now = new Date();
const minutes = (n: number) => new Date(now.getTime() + n * 60_000);
const days = (n: number) => minutes(n * 1440);
const orderNo = () => `SWP-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;

async function reset() {
  // Order matters for FK constraints.
  const tables = [
    "WebhookEvent", "AuditLog", "FraudFlag", "Notification", "SupportTicket", "RecentView", "Favorite", "Review",
    "Commission", "Payout", "Refund", "Payment", "UsageRecord", "CreditLedger", "Order", "PromoCode", "Rental",
    "RentalPlan", "Service", "ProviderAuthorization", "Seller", "Subscription", "SubscriptionPlan", "Category",
    "Session", "User", "FeatureFlag", "PlatformSetting",
  ];
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t}"`).join(", ")} CASCADE`);
}

async function main() {
  // `--if-empty` (used by `vercel-build`) seeds a fresh database once and never wipes existing data.
  if (process.argv.includes("--if-empty") && (await db.subscriptionPlan.count()) > 0) {
    console.log("Database already has data — skipping seed.");
    return;
  }
  // A real production site must not ship admin@swapdo.dev with the password printed in the README.
  if (LIVE_SITE && !process.env.SEED_PASSWORD) {
    throw new Error("Set SEED_PASSWORD (or DEMO_MODE=true) before the first production deploy — it becomes the password of admin@swapdo.dev.");
  }
  console.log("Resetting database…");
  await reset();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  // ── Platform configuration
  const plans = new Map<string, string>();
  for (const p of DEFAULT_MEMBERSHIP_PLANS) {
    const row = await db.subscriptionPlan.create({ data: { ...p, features: [...p.features] } });
    plans.set(p.code, row.id);
  }
  for (const [key, value] of Object.entries(DEFAULT_PLATFORM_SETTINGS)) await db.platformSetting.create({ data: { key, value } });
  for (const f of DEFAULT_FEATURE_FLAGS) await db.featureFlag.create({ data: f });

  // ── Admin account and categories (every site)
  const admin = await db.user.create({ data: { email: "admin@swapdo.dev", name: "Aditi Rao", passwordHash, role: "ADMIN" } });
  await db.subscription.create({ data: { userId: admin.id, planId: plans.get("FREE")!, status: "ACTIVE", currentPeriodStart: now } });
  const categories = new Map<string, string>();
  for (const [i, c] of DEMO_CATEGORIES.entries()) {
    const row = await db.category.create({ data: { ...c, sortOrder: i } });
    categories.set(c.slug, row.id);
  }
  if (LIVE_SITE) {
    console.log("Seeded platform config, categories and admin@swapdo.dev (password: SEED_PASSWORD). No demo data on a live site.");
    return;
  }

  // ── Demo data from here on
  await db.promoCode.createMany({
    data: [
      { code: "WELCOME10", description: "10% off your first rental", percentOff: 10, maxRedemptions: 1000 },
      { code: "CREATOR20", description: "Creator week launch offer", percentOff: 20, maxRedemptions: 200, expiresAt: days(30) },
      { code: "EXPIRED5", description: "Expired example", percentOff: 5, expiresAt: days(-2), active: true },
    ],
  });

  // ── Accounts
  const customer = await db.user.create({ data: { email: "user@swapdo.dev", name: "Rahul Verma", passwordHash } });
  const sellerUser = await db.user.create({ data: { email: "seller@swapdo.dev", name: "Neha Kapoor", passwordHash, role: "SELLER" } });
  const extraUsers = await Promise.all(
    ["Priya Nair", "Sameer Joshi", "Leela Menon", "Imran Qureshi", "Tara Singh"].map((name, i) =>
      db.user.create({ data: { email: `member${i + 1}@swapdo.dev`, name, passwordHash, createdAt: days(-(i * 9 + 3)) } }),
    ),
  );

  // ── Sellers (seller@swapdo.dev owns Northwind so the seller dashboard has data)
  const sellers = new Map<string, { id: string; authId: string }>();
  for (const s of DEMO_SELLERS) {
    const owner =
      s.key === "northwind"
        ? sellerUser
        : await db.user.create({ data: { email: `provider-${s.key}@swapdo.dev`, name: s.name, passwordHash: await bcrypt.hash(randomBytes(16).toString("hex"), 4), role: "SELLER" } });
    const seller = await db.seller.create({
      data: { userId: owner.id, slug: s.key, displayName: s.name, bio: s.bio, website: s.website, status: "APPROVED", verified: s.verified, isDemo: true },
    });
    const auth = await db.providerAuthorization.create({
      data: { sellerId: seller.id, kind: s.authKind, title: s.authTitle, reference: `DEMO-${s.key.toUpperCase()}-001`, status: "APPROVED", validUntil: days(365), reviewedById: admin.id, reviewNotes: "Demo authorization — simulated for illustration." },
    });
    sellers.set(s.key, { id: seller.id, authId: auth.id });
  }

  // Pending applicant for the admin approval queue
  const applicant = await db.user.create({ data: { email: "applicant@swapdo.dev", name: "Kabir Shah", passwordHash } });
  const pendingSeller = await db.seller.create({
    data: { userId: applicant.id, slug: "nimbus-ai", displayName: "Nimbus AI Tools", bio: "We build translation and dubbing tools for regional-language creators using our own models.", status: "PENDING", isDemo: true, website: "https://nimbus.example" },
  });
  await db.providerAuthorization.create({
    data: { sellerId: pendingSeller.id, kind: "OWN_SERVICE", title: "First-party service ownership", reference: "NIMBUS-TM-2026-118", status: "PENDING" },
  });

  // ── Services, plans, reviews
  const services = new Map<string, { id: string; plans: { id: string; durationMinutes: number; priceMinor: number; usageLimit: number | null }[]; name: string; sellerKey: string }>();
  for (const [i, s] of DEMO_SERVICES.entries()) {
    const seller = sellers.get(s.seller)!;
    const reviews = demoReviewsFor(i);
    const ratingAvg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    const service = await db.service.create({
      data: {
        slug: s.slug, name: s.name, tagline: s.tagline, description: s.description, features: s.features, tags: s.tags,
        icon: s.icon, accent: s.accent, accessMethod: s.accessMethod, featured: !!s.featured, capacity: s.capacity ?? null,
        popularity: s.popularity, isDemo: true, status: "APPROVED", sellerId: seller.id, categoryId: categories.get(s.category)!,
        authorizationId: seller.authId, ratingAvg: Math.round(ratingAvg * 10) / 10, ratingCount: reviews.length,
        createdAt: days(-(DEMO_SERVICES.length - i) * 3),
        plans: { create: s.plans.map(([durationMinutes, priceMinor, usageLimit]) => ({ durationMinutes, priceMinor, usageLimit, usageUnit: s.usageUnit })) },
        reviews: { create: reviews.map((r) => ({ authorName: r.authorName, rating: r.rating, title: r.title, body: r.body, isDemo: true, createdAt: days(-r.daysAgo) })) },
      },
      include: { plans: true },
    });
    services.set(s.slug, { id: service.id, plans: service.plans, name: s.name, sellerKey: s.seller });
  }

  // Pending listing for the moderation queue
  await db.service.create({
    data: {
      slug: "northwind-sheets-copilot", name: "Northwind Sheets Copilot", tagline: "Formula help and data clean-up inside your spreadsheets.",
      description: "An add-on that writes formulas, cleans messy columns and builds pivot summaries from plain-language instructions. Connected through the official add-on marketplace.",
      features: ["Formula generation", "Column clean-up", "Pivot summaries"], tags: ["spreadsheets", "productivity"], icon: "table", accent: "#6ee7c8",
      accessMethod: "OAUTH", status: "PENDING_REVIEW", isDemo: true, sellerId: sellers.get("northwind")!.id, categoryId: categories.get("productivity")!,
      authorizationId: sellers.get("northwind")!.authId,
      plans: { create: [{ durationMinutes: 1440, priceMinor: 9900, usageLimit: 300 }, { durationMinutes: 43200, priceMinor: 69900, usageLimit: 8000 }] },
    },
  });

  // ── Customer state: Pro membership, credits, rentals, orders
  await db.subscription.create({
    data: { userId: customer.id, planId: plans.get("PRO")!, interval: "MONTHLY", status: "ACTIVE", currentPeriodStart: days(-12), currentPeriodEnd: days(18) },
  });
  for (const u of [sellerUser, applicant]) {
    await db.subscription.create({ data: { userId: u.id, planId: plans.get("FREE")!, status: "ACTIVE", currentPeriodStart: now } });
  }
  for (const [i, u] of extraUsers.entries()) {
    const code = ["STARTER", "PRO", "FREE", "ELITE", "STARTER"][i]!;
    await db.subscription.create({ data: { userId: u.id, planId: plans.get(code)!, status: i === 4 ? "PAST_DUE" : "ACTIVE", currentPeriodStart: days(-10), currentPeriodEnd: code === "FREE" ? null : days(20), graceUntil: i === 4 ? days(2) : null } });
  }

  const commissionRate = DEFAULT_PLATFORM_SETTINGS.commissionRateBps;
  async function paidOrder(opts: { userId: string; purpose: "RENTAL_NEW" | "SUBSCRIPTION"; description: string; amount: number; paidAt: Date; rentalId?: string; sellerKey?: string; planCode?: string }) {
    const order = await db.order.create({
      data: {
        number: orderNo(), userId: opts.userId, purpose: opts.purpose, status: "PAID", description: opts.description,
        subtotalMinor: opts.amount, totalMinor: opts.amount, paidAt: opts.paidAt, createdAt: opts.paidAt, rentalId: opts.rentalId,
        subscriptionPlanCode: opts.planCode, billingInterval: opts.planCode ? "MONTHLY" : undefined,
        payments: { create: { provider: "mock", providerOrderId: `mock_order_${randomBytes(9).toString("hex")}`, providerPaymentId: `mock_pay_${randomBytes(9).toString("hex")}`, status: "CAPTURED", amountMinor: opts.amount, sandbox: true, createdAt: opts.paidAt } },
      },
    });
    if (opts.sellerKey) {
      const commissionMinor = Math.round((opts.amount * commissionRate) / 10000);
      await db.commission.create({ data: { orderId: order.id, sellerId: sellers.get(opts.sellerKey)!.id, grossMinor: opts.amount, rateBps: commissionRate, commissionMinor, netMinor: opts.amount - commissionMinor, createdAt: opts.paidAt } });
    }
    return order;
  }

  const proOrder = await paidOrder({ userId: customer.id, purpose: "SUBSCRIPTION", description: "Pro membership · monthly", amount: 149900, paidAt: days(-12), planCode: "PRO" });
  await db.creditLedger.create({ data: { userId: customer.id, delta: 1200, reason: "membership_credits", refType: "order", refId: proOrder.id, createdAt: days(-12) } });

  async function seedRental(slug: string, durationMinutes: number, startOffsetMin: number, status: "ACTIVE" | "EXPIRED", usageCount: number, userId = customer.id) {
    const svc = services.get(slug)!;
    const plan = svc.plans.find((p) => p.durationMinutes === durationMinutes)!;
    const startsAt = minutes(startOffsetMin);
    const rental = await db.rental.create({
      data: { userId, serviceId: svc.id, planId: plan.id, status, startsAt, endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000), durationMinutes, usageLimit: plan.usageLimit, usageCount, createdAt: startsAt },
    });
    const price = Math.round(plan.priceMinor * (userId === customer.id ? 0.88 : 1));
    await paidOrder({ userId, purpose: "RENTAL_NEW", description: `${svc.name} · rental`, amount: price, paidAt: startsAt, rentalId: rental.id, sellerKey: svc.sellerKey });
    for (let i = 0; i < Math.min(usageCount, 12); i++) {
      await db.usageRecord.create({ data: { userId, rentalId: rental.id, serviceId: svc.id, units: 1, action: "request", createdAt: new Date(startsAt.getTime() + (i + 1) * 60_000) } });
    }
    return rental;
  }

  const r1 = await seedRental("lumen-assistant-pro", 1440, -300, "ACTIVE", 214);
  await seedRental("aurora-motion", 180, -170, "ACTIVE", 11); // expiring soon
  await seedRental("northwind-code-copilot", 10080, -2 * 1440, "ACTIVE", 1840);
  await seedRental("meridian-sports-live", 1440, -4 * 1440, "EXPIRED", 0);
  await seedRental("aurora-image-studio", 360, -9 * 1440, "EXPIRED", 162);
  await seedRental("halcyon-voice-studio", 60, -15 * 1440, "EXPIRED", 15);

  // Other members' activity → seller earnings, admin metrics
  const otherSlugs = ["northwind-code-copilot", "northwind-insights", "northwind-docs-ai", "northwind-automate", "meridian-sports-live", "aurora-image-studio", "lumen-assistant-pro", "northwind-crm-lite"];
  for (const [i, u] of extraUsers.entries()) {
    for (let j = 0; j < 3; j++) {
      const slug = otherSlugs[(i * 3 + j) % otherSlugs.length]!;
      const svc = services.get(slug)!;
      const dur = svc.plans[j % svc.plans.length]!.durationMinutes;
      await seedRental(slug, dur, -((i * 5 + j * 3 + 1) * 1440), "EXPIRED", 5 + j, u.id);
    }
  }
  const nwId = sellers.get("northwind")!.id;
  const payout = await db.payout.create({ data: { sellerId: nwId, amountMinor: 0, status: "PAID", processedAt: days(-5), createdAt: days(-7), notes: "Demo payout (sandbox)" } });
  const oldest = await db.commission.findMany({ where: { sellerId: nwId }, orderBy: { createdAt: "asc" }, take: 3 });
  await db.commission.updateMany({ where: { id: { in: oldest.map((c) => c.id) } }, data: { status: "PAID_OUT", payoutId: payout.id } });
  await db.payout.update({ where: { id: payout.id }, data: { amountMinor: oldest.reduce((a, c) => a + c.netMinor, 0) } });

  // Credits spent at checkout
  await db.creditLedger.create({ data: { userId: customer.id, delta: -150, reason: "checkout_hold", refType: "order", refId: "seed-history-1", createdAt: days(-4) } });

  // Favorites & recently viewed
  for (const slug of ["aurora-motion", "northwind-insights", "meridian-documentary-pass", "crescendo-channel-management"]) {
    await db.favorite.create({ data: { userId: customer.id, serviceId: services.get(slug)!.id } });
  }
  for (const [i, slug] of ["aurora-shorts-studio", "lumen-research-agent", "northwind-docs-ai"].entries()) {
    await db.recentView.create({ data: { userId: customer.id, serviceId: services.get(slug)!.id, viewedAt: minutes(-(i + 1) * 45) } });
  }

  // A refund request & failed payment for admin queues
  const failed = await db.order.create({
    data: {
      number: orderNo(), userId: extraUsers[2]!.id, purpose: "RENTAL_NEW", status: "FAILED", description: "Aurora Motion · 3 hours", subtotalMinor: 24900, totalMinor: 24900, createdAt: minutes(-90),
      payments: { create: { provider: "mock", providerOrderId: `mock_order_${randomBytes(9).toString("hex")}`, status: "FAILED", amountMinor: 24900, failureReason: "Card declined (sandbox simulation)" } },
    },
  });
  const refundable = await db.order.findFirstOrThrow({ where: { userId: extraUsers[0]!.id, status: "PAID" }, orderBy: { createdAt: "desc" } });
  await db.refund.create({ data: { orderId: refundable.id, amountMinor: refundable.totalMinor, reason: "The service was unavailable for most of my rental window.", requestedById: extraUsers[0]!.id } });
  await db.fraudFlag.create({ data: { userId: extraUsers[2]!.id, orderId: failed.id, reason: "Multiple declined payments from new account", severity: "medium" } });

  // Notifications & tickets
  await db.notification.createMany({
    data: [
      { userId: customer.id, kind: "rental_expiring", title: "Aurora Motion ends soon", body: "Less than 15 minutes left. Extend to keep generating.", href: `/dashboard/rentals` },
      { userId: customer.id, kind: "rental_active", title: "Lumen Assistant Pro is ready", body: "Your 24-hour access has started.", href: `/dashboard/rentals/${r1.id}`, readAt: minutes(-280), createdAt: minutes(-300) },
      { userId: customer.id, kind: "subscription", title: "Welcome to Pro", body: "1,200 credits were added to your balance.", href: "/dashboard/subscription", readAt: days(-12), createdAt: days(-12) },
    ],
  });
  await db.supportTicket.createMany({
    data: [
      { userId: customer.id, subject: "Invoice GST details", body: "Can I add my GSTIN to past invoices?", status: "PENDING", createdAt: days(-2) },
      { userId: extraUsers[1]!.id, sellerId: nwId, subject: "Copilot plugin not connecting", body: "The VS Code extension says my session is invalid after renewal.", status: "OPEN", priority: "high", createdAt: minutes(-200) },
    ],
  });
  await db.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "seller.approve", entityType: "Seller", entityId: nwId, createdAt: days(-40) },
      { actorId: admin.id, action: "settings.update", entityType: "PlatformSetting", entityId: "commissionRateBps", metadata: { value: commissionRate }, createdAt: days(-20) },
    ],
  });

  console.log(`Seeded ${DEMO_SERVICES.length + 1} services, ${DEMO_SELLERS.length + 1} sellers.`);
  console.log(`Demo accounts${SEED_PASSWORD === DEMO_PASSWORD ? ` (password: ${DEMO_PASSWORD})` : " (password: SEED_PASSWORD)"}: user@swapdo.dev, seller@swapdo.dev, admin@swapdo.dev`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
