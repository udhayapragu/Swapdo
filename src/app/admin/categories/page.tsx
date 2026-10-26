import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { ServiceIcon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const cats = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { services: true } } } });
  return (
    <>
      <PageHeader title="Categories" description="Hidden categories disappear from the marketplace and seller listing form." />
      <DataTable head={["Category", "Tagline", "Services", "State", ""]}>
        {cats.map((c) => (
          <tr key={c.id}>
            <td><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10" style={{ background: `${c.accent}22` }}><ServiceIcon name={c.icon} className="h-4 w-4" /></span><span className="text-ivory">{c.name}</span></span></td>
            <td className="text-mist">{c.tagline}</td>
            <td className="tabular-nums">{c._count.services}</td>
            <td>{c.active ? <Badge tone="success">visible</Badge> : <Badge>hidden</Badge>}</td>
            <td className="text-right"><ActionButton endpoint={`/api/admin/categories/${c.id}`} method="PATCH" body={{ active: !c.active }} label={c.active ? "Hide" : "Show"} success="Category updated" /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
