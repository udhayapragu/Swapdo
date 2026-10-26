import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { PromoForm } from "@/components/admin/promo-form";
import { Panel, PanelHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Promo codes" };

export default async function AdminPromosPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const promos = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Promo codes" description="Percentage discounts applied server-side after member discounts." />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <DataTable head={["Code", "Discount", "Redemptions", "Expires", "State", ""]}>
          {promos.map((p) => {
            const expired = p.expiresAt && p.expiresAt <= now;
            return (
              <tr key={p.id}>
                <td><p className="font-mono text-ivory">{p.code}</p><p className="text-xs text-fog">{p.description}</p></td>
                <td>{p.percentOff}%</td>
                <td className="tabular-nums">{p.redemptions}{p.maxRedemptions ? ` / ${p.maxRedemptions}` : ""}</td>
                <td className="text-fog">{p.expiresAt ? formatDate(p.expiresAt) : "—"}</td>
                <td>{expired ? <Badge>expired</Badge> : p.active ? <Badge tone="success">active</Badge> : <Badge>paused</Badge>}</td>
                <td className="text-right"><ActionButton endpoint={`/api/admin/promos/${p.id}`} method="PATCH" body={{ active: !p.active }} label={p.active ? "Pause" : "Activate"} success="Promo updated" /></td>
              </tr>
            );
          })}
        </DataTable>
        <Panel>
          <PanelHeader title="New promo code" />
          <div className="p-5 sm:p-6"><PromoForm /></div>
        </Panel>
      </div>
    </>
  );
}
