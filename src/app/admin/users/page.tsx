import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requirePageUser({ roles: ["ADMIN"] });
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : undefined,
    include: { subscription: { include: { plan: { select: { name: true } } } }, _count: { select: { rentals: true, orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <PageHeader title="Users" description="Search accounts, adjust roles and suspend abusive users. Suspension revokes all sessions immediately." />
      <form className="mb-5"><label htmlFor="user-q" className="sr-only">Search users</label><input id="user-q" name="q" defaultValue={q} placeholder="Search name or email…" className="h-11 w-full max-w-sm rounded-full border border-white/10 bg-obsidian-850/80 px-5 text-sm text-ivory placeholder:text-smoke focus:border-gold-400/60 focus:outline-none" /></form>
      <DataTable head={["User", "Role", "Plan", "Rentals", "Joined", "Status", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td><p className="text-ivory">{u.name}</p><p className="text-xs text-fog">{u.email}</p></td>
            <td><Badge tone={u.role === "ADMIN" ? "gold" : u.role === "SELLER" ? "violet" : "neutral"}>{u.role.toLowerCase()}</Badge></td>
            <td className="text-mist">{u.subscription?.plan.name ?? "—"}</td>
            <td className="tabular-nums">{u._count.rentals}</td>
            <td className="text-fog">{formatDate(u.createdAt)}</td>
            <td><StatusBadge status={u.status} /></td>
            <td>
              {u.id !== me.id && (
                <div className="flex justify-end gap-1">
                  {u.status === "ACTIVE"
                    ? <ActionButton endpoint={`/api/admin/users/${u.id}`} method="PATCH" body={{ status: "SUSPENDED" }} label="Suspend" variant="danger" confirm={`Suspend ${u.email}? They’ll be signed out everywhere.`} success="User suspended" />
                    : <ActionButton endpoint={`/api/admin/users/${u.id}`} method="PATCH" body={{ status: "ACTIVE" }} label="Reinstate" variant="outline" success="User reinstated" />}
                  {u.role === "USER" && <ActionButton endpoint={`/api/admin/users/${u.id}`} method="PATCH" body={{ role: "ADMIN" }} label="Make admin" confirm="Grant full administrator access to this user?" success="Role updated" />}
                </div>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
