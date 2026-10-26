// The password printed in the README for the seeded demo accounts.
export const DEMO_PASSWORD = "SwapdoDemo2026";

/**
 * Reads SEED_PASSWORD for a Vercel build. Returns undefined when it isn't set, and throws when it is set but
 * unusable. Errors name the Vercel environment and branch the build ran for, never the value itself.
 */
export function readSeedPassword(env: Record<string, string | undefined> = process.env): string | undefined {
  const value = env.SEED_PASSWORD;
  if (value === undefined) return undefined;
  if (!value.trim()) throw new Error("SEED_PASSWORD is set but empty. Give it a real password in Vercel and redeploy.");
  if (value === DEMO_PASSWORD) throw new Error("SEED_PASSWORD must not be the public demo password from the README.");
  if (value.length < 8) throw new Error("SEED_PASSWORD must be at least 8 characters.");
  return value;
}

/** Why SEED_PASSWORD is missing from this build, so the fix is obvious from the build log. */
export function missingSeedPasswordHelp(env: Record<string, string | undefined> = process.env): string {
  const target = env.VERCEL_ENV ?? "local";
  const branch = env.VERCEL_GIT_COMMIT_REF ? ` (branch "${env.VERCEL_GIT_COMMIT_REF}")` : "";
  return `SEED_PASSWORD is not available to this ${target} build${branch}. In Vercel → Settings → Environment Variables, enable SEED_PASSWORD for the "${target}" environment (check any branch filter), then start a new deployment.`;
}
