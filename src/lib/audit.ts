import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Tx = Prisma.TransactionClient | typeof db;

export async function audit(
  entry: { actorId?: string | null; action: string; entityType: string; entityId?: string | null; metadata?: Prisma.InputJsonValue; ip?: string },
  tx: Tx = db,
) {
  await tx.auditLog.create({ data: { ...entry, actorId: entry.actorId ?? null } });
}

export async function notify(
  userId: string,
  n: { kind: string; title: string; body: string; href?: string },
  tx: Tx = db,
) {
  await tx.notification.create({ data: { userId, ...n } });
}
