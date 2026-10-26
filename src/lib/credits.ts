import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Tx = Prisma.TransactionClient;

export async function creditBalance(userId: string, tx: Tx | typeof db = db): Promise<number> {
  const agg = await tx.creditLedger.aggregate({ where: { userId }, _sum: { delta: true } });
  return agg._sum.delta ?? 0;
}

/** Serialises credit-affecting work for one user inside a transaction. */
export async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

/** Book a ledger entry once; duplicates (same refType/refId/reason) are ignored. */
export async function bookCredits(
  tx: Tx,
  entry: { userId: string; delta: number; reason: string; refType: string; refId: string },
): Promise<boolean> {
  if (entry.delta === 0) return false;
  const res = await tx.creditLedger.createMany({ data: [entry], skipDuplicates: true });
  return res.count === 1;
}
