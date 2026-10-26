import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { PageHeader } from "@/components/dashboard/shell";
import { ListingForm } from "@/components/seller/listing-form";
import { EmptyState, Panel } from "@/components/ui/card";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const { seller } = await requireSellerPage();
  const [categories, auths] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.providerAuthorization.findMany({ where: { sellerId: seller.id, status: "APPROVED", OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] } }),
  ]);
  return (
    <>
      <Link href="/seller/listings" className="mb-6 inline-flex items-center gap-1.5 text-sm text-fog hover:text-ivory"><ArrowLeft className="h-4 w-4" /> Listings</Link>
      <PageHeader title="New listing" description="Listings are reviewed by our team before they go live." />
      <div className="max-w-3xl">
        {auths.length === 0 ? (
          <Panel><EmptyState title="No approved authorization" body="You need an approved authorization before you can list a service. Contact support to add one." /></Panel>
        ) : (
          <ListingForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} authorizations={auths.map((a) => ({ id: a.id, name: `${a.title} (${a.reference})` }))} />
        )}
      </div>
    </>
  );
}
