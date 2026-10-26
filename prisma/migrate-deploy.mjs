import { spawnSync } from "node:child_process";

// `prisma migrate deploy` for Vercel builds. It holds a Postgres session advisory lock and gives up after 10s (P1002).
// Two things make that lock unavailable on Neon:
//  - a pooled (`-pooler`) URL: PgBouncer can leave the lock held on a server connection after the build ends,
//    blocking every later deploy until that connection is recycled. Migrations always use the direct host.
//  - Preview and Production builds migrating the same database at the same moment. We retry on P1002.
// Only migrations run here, so nothing is deleted or reset.

/** Neon's direct host is the pooled host without `-pooler`; DIRECT_URL wins when set. */
export function directUrl(url) {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("-pooler.") && !u.searchParams.has("pgbouncer")) return url;
    u.hostname = u.hostname.replace(/-pooler(?=\.)/, "");
    u.searchParams.delete("pgbouncer");
    return u.toString();
  } catch {
    return url;
  }
}

const RETRIES = 4;

function main() {
  const env = { ...process.env };
  const url = directUrl(process.env.DATABASE_URL);
  if (url) env.DATABASE_URL = url;
  if (url !== process.env.DATABASE_URL) console.log("Running migrations over the direct (non-pooled) database connection.");

  for (let attempt = 1; ; attempt++) {
    const run = spawnSync("npx", ["prisma", "migrate", "deploy"], { env, encoding: "utf8" });
    process.stdout.write(run.stdout ?? "");
    process.stderr.write(run.stderr ?? "");
    if (run.status === 0) return;
    const lockBusy = `${run.stdout}${run.stderr}`.includes("P1002");
    if (!lockBusy || attempt > RETRIES) process.exit(run.status ?? 1);
    const wait = attempt * 15;
    console.log(`Migration lock is busy (another deploy is migrating). Retrying in ${wait}s (${attempt}/${RETRIES})…`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait * 1000);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
