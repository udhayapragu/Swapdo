import type { Metadata } from "next";
import { BadgeCheck, Banknote, Clock, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SellerApplyForm } from "@/components/seller/apply-form";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sell on SWAPDO", description: "Offer your authorized AI tools, licensed content or creator services by the hour, week or month.", alternates: { canonical: "/sell" } };

export default async function SellPage() {
  const user = await getCurrentUser();
  const [settings, seller] = await Promise.all([getPlatformSettings(), user?.sellerId ? db.seller.findUnique({ where: { id: user.sellerId } }) : null]);
  const perks = [
    { icon: Clock, title: "Time-based revenue", body: "Monetise idle capacity with hourly, weekly and monthly passes — expiry is enforced for you." },
    { icon: Banknote, title: `${100 - settings.commissionRateBps / 100}% to you`, body: `A flat ${settings.commissionRateBps / 100}% platform commission. Request payouts from ${formatMoney(settings.minimumPayoutMinor)}.` },
    { icon: ShieldCheck, title: "Fraud & refund handling", body: "Server-verified payments, velocity checks and a clear refund process protect your earnings." },
    { icon: BadgeCheck, title: "Verified badge", body: "Approved providers earn a verified badge that customers trust." },
  ];
  return (
    <div className="container-page pt-28 lg:pt-36">
      <SectionHeading eyebrow="For providers" title="Your service," accent="by the hour." body="SWAPDO lists only services that providers are authorized to offer. Apply once, then publish listings against your approved authorization." />
      <h1 className="sr-only">Sell on SWAPDO</h1>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map((p) => (
          <div key={p.title} className="glass rounded-2xl p-6">
            <p.icon className="h-6 w-6 text-gold-300" strokeWidth={1.5} />
            <h2 className="mt-4 text-[15px] font-semibold text-ivory">{p.title}</h2>
            <p className="mt-1.5 text-sm text-fog">{p.body}</p>
          </div>
        ))}
      </div>
      <section className="mx-auto mt-16 max-w-3xl">
        <div className="glass gold-border rounded-3xl p-6 sm:p-8">
          {!user ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-ivory">Apply to become a provider</h2>
              <p className="mt-2 text-sm text-fog">Create a free account or sign in to start your application.</p>
              <div className="mt-6 flex justify-center gap-3">
                <ButtonLink href="/register?next=/sell">Create account</ButtonLink>
                <ButtonLink href="/login?next=/sell" variant="glass">Sign in</ButtonLink>
              </div>
            </div>
          ) : seller ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-ivory">{seller.displayName}</h2>
              <div className="mt-3 flex justify-center"><StatusBadge status={seller.status} /></div>
              <p className="mt-3 text-sm text-fog">
                {seller.status === "APPROVED" ? "You’re approved. Manage listings, orders and payouts from your seller studio." : seller.status === "PENDING" ? "Your application is under review. We’ll notify you as soon as it’s decided." : seller.verificationNotes || "Contact support for details about your application."}
              </p>
              {seller.status === "APPROVED" && <ButtonLink href="/seller" className="mt-6">Open seller studio</ButtonLink>}
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ivory">Provider application</h2>
              <p className="mt-1.5 mb-6 text-sm text-fog">Takes about three minutes. Reviewed within two business days.</p>
              <SellerApplyForm />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
