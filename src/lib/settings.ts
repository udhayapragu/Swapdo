import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { DEFAULT_PLATFORM_SETTINGS } from "@/config/membership-plans";

type Tx = Prisma.TransactionClient | typeof db;
export type PlatformSettings = { -readonly [K in keyof typeof DEFAULT_PLATFORM_SETTINGS]: number };

export async function getPlatformSettings(tx: Tx = db): Promise<PlatformSettings> {
  const rows = await tx.platformSetting.findMany();
  const out: PlatformSettings = { ...DEFAULT_PLATFORM_SETTINGS };
  for (const r of rows) if (r.key in out && typeof r.value === "number") out[r.key as keyof PlatformSettings] = r.value;
  return out;
}

export async function isFeatureEnabled(key: string, tx: Tx = db): Promise<boolean> {
  const flag = await tx.featureFlag.findUnique({ where: { key } });
  return flag?.enabled ?? false;
}
