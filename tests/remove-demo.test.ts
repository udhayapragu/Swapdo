import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DEMO_PASSWORD, readSeedPassword } from "../prisma/seed-password";

const ADMIN = "admin@swapdo.dev";
const realEmail = `real-${randomBytes(4).toString("hex")}@test.dev`;

// Runs the build step exactly as `vercel-build` does, against the test database.
function removeDemo(env: Record<string, string | undefined>) {
  const run = spawnSync("npx", ["tsx", "prisma/remove-demo.ts", "--if-live"], {
    env: { ...process.env, VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "my-branch", SEED_PASSWORD: undefined, ...env },
    encoding: "utf8",
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}
const adminHash = async () => (await db.user.findUniqueOrThrow({ where: { email: ADMIN } })).passwordHash;

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: { in: [ADMIN, "user@swapdo.dev"] } } });
  await db.user.create({ data: { email: ADMIN, name: "Admin", role: "ADMIN", passwordHash: await hashPassword(DEMO_PASSWORD) } });
  await db.user.create({ data: { email: "user@swapdo.dev", name: "Demo user", passwordHash: "x" } });
  await db.user.create({ data: { email: realEmail, name: "Real user", passwordHash: "x" } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { in: [ADMIN, "user@swapdo.dev", realEmail] } } });
});

describe("readSeedPassword", () => {
  it("rejects blank, demo and short values", () => {
    expect(readSeedPassword({})).toBeUndefined();
    expect(() => readSeedPassword({ SEED_PASSWORD: "  " })).toThrow(/empty/);
    expect(() => readSeedPassword({ SEED_PASSWORD: DEMO_PASSWORD })).toThrow(/demo password/);
    expect(() => readSeedPassword({ SEED_PASSWORD: "short" })).toThrow(/8 characters/);
    expect(readSeedPassword({ SEED_PASSWORD: "Strong-Pass-42" })).toBe("Strong-Pass-42");
  });
});

describe("remove-demo build step", () => {
  it("stops without changing anything when SEED_PASSWORD is missing, and says why", async () => {
    const before = await adminHash();
    const run = removeDemo({});
    expect(run.status).not.toBe(0);
    expect(run.output).toContain('not available to this preview build (branch "my-branch")');
    expect(await adminHash()).toBe(before);
    expect(await db.user.count({ where: { email: "user@swapdo.dev" } })).toBe(1);
  });

  it("refuses the demo password as SEED_PASSWORD", async () => {
    const run = removeDemo({ SEED_PASSWORD: DEMO_PASSWORD });
    expect(run.status).not.toBe(0);
    expect(await verifyPassword(DEMO_PASSWORD, await adminHash())).toBe(true);
  });

  it("replaces the demo password once, never prints it, and keeps real users", async () => {
    const secret = `Real-${randomBytes(6).toString("hex")}`;
    const run = removeDemo({ SEED_PASSWORD: secret });
    expect(run.status).toBe(0);
    expect(run.output).not.toContain(secret);
    const hash = await adminHash();
    expect(await verifyPassword(secret, hash)).toBe(true);
    expect(await verifyPassword(DEMO_PASSWORD, hash)).toBe(false);
    expect(await db.user.count({ where: { email: "user@swapdo.dev" } })).toBe(0);
    expect(await db.user.count({ where: { email: realEmail } })).toBe(1);

    // A repeat build, even with a different SEED_PASSWORD, leaves the admin password alone.
    expect(removeDemo({ SEED_PASSWORD: "Another-Pass-99" }).status).toBe(0);
    expect(removeDemo({}).status).toBe(0);
    expect(await adminHash()).toBe(hash);
  });
});
