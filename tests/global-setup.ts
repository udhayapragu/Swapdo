import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// Integration tests run against TEST_DATABASE_URL (never the dev database).
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://swapdo:swapdo_dev@localhost:5432/swapdo_test?schema=public";
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.endsWith("_test")) throw new Error(`Refusing to run tests against "${dbName}" — the test database name must end with _test.`);
  process.env.DATABASE_URL = url;
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });

  // Start every run from empty tables so tests never depend on leftovers.
  const db = new PrismaClient({ datasourceUrl: url });
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  await db.$disconnect();
}
