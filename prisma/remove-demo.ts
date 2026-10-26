import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Removes the demo catalog (isDemo sellers and listings) and the seeded @swapdo.dev accounts from a
// database seeded with demo data, keeping platform config, categories and admin@swapdo.dev.
// `--if-live` (used by `vercel-build`) only acts on a production deploy without DEMO_MODE=true.
const db = new PrismaClient();
const ADMIN_EMAIL = "admin@swapdo.dev";
const DEMO_PASSWORD = "SwapdoDemo2026";

async function main() {
  const live = process.env.VERCEL_ENV === "production" && process.env.DEMO_MODE !== "true";
  if (process.argv.includes("--if-live") && !live) return;

  // The seeded admin must not keep the password printed in the README. Checked first so a failed build changes nothing.
  const admin = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const adminHasDemoPassword = !!admin && (await bcrypt.compare(DEMO_PASSWORD, admin.passwordHash));
  if (adminHasDemoPassword && !process.env.SEED_PASSWORD) throw new Error(`${ADMIN_EMAIL} still uses the public demo password. Set SEED_PASSWORD to replace it.`);

  const sellerIds = (await db.seller.findMany({ where: { isDemo: true }, select: { id: true } })).map((s) => s.id);
  const serviceIds = (await db.service.findMany({ where: { OR: [{ isDemo: true }, { sellerId: { in: sellerIds } }] }, select: { id: true } })).map((s) => s.id);
  const userIds = (await db.user.findMany({ where: { email: { endsWith: "@swapdo.dev", not: ADMIN_EMAIL } }, select: { id: true } })).map((u) => u.id);

  if (sellerIds.length || serviceIds.length || userIds.length) {
    // Children before parents: several of these relations restrict deletes.
    const removed = await db.$transaction(async (tx) => {
      const rentalIds = (await tx.rental.findMany({ where: { OR: [{ serviceId: { in: serviceIds } }, { userId: { in: userIds } }] }, select: { id: true } })).map((r) => r.id);
      const orderIds = (await tx.order.findMany({ where: { OR: [{ userId: { in: userIds } }, { rentalId: { in: rentalIds } }] }, select: { id: true } })).map((o) => o.id);
      await tx.refund.deleteMany({ where: { OR: [{ orderId: { in: orderIds } }, { requestedById: { in: userIds } }] } });
      await tx.commission.deleteMany({ where: { OR: [{ orderId: { in: orderIds } }, { sellerId: { in: sellerIds } }] } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      await tx.usageRecord.deleteMany({ where: { OR: [{ serviceId: { in: serviceIds } }, { rentalId: { in: rentalIds } }, { userId: { in: userIds } }] } });
      await tx.rental.deleteMany({ where: { id: { in: rentalIds } } });
      await tx.payout.deleteMany({ where: { sellerId: { in: sellerIds } } });
      const services = await tx.service.deleteMany({ where: { id: { in: serviceIds } } });
      await tx.seller.deleteMany({ where: { id: { in: sellerIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
      return services.count;
    }, { timeout: 60_000 });
    console.log(`Removed ${removed} demo listings, ${sellerIds.length} demo sellers and ${userIds.length} demo accounts.`);
  }

  if (admin && adminHasDemoPassword) {
    await db.user.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(process.env.SEED_PASSWORD!, 12) } });
    await db.session.deleteMany({ where: { userId: admin.id } });
    console.log(`Replaced the demo password of ${ADMIN_EMAIL} with SEED_PASSWORD.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
