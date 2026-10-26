import type { Metadata } from "next";
import { Coins, Crown, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { creditBalance } from "@/lib/credits";
import { getMembershipPlans } from "@/lib/catalog";
import { isSandboxPayments } from "@/lib/payments";
import { PageHeader } from "@/components/dashboard/shell";
import { SubscriptionActions } from "@/components/dashboard/subscription-actions";
import { MembershipPlans } from "@/components/marketing/membership-plans";
import { Panel, PanelHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Membership" };

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser();
  const { welcome } = await searchParams;
  const [sub, ent, credits, plans, ledger] = await Promise.all([
    db.subscription.findUnique({ where: { userId: user.id }, include: { plan: true, scheduledPlan: true } }),
    getEntitlements(user.id),
    creditBalance(user.id),
    getMembershipPlans(),
    db.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const paid = !!sub && sub.plan.code !== "FREE";
  const REASONS: Record<string, string> = { membership_credits: "Membership credits", checkout_hold: "Used at checkout", checkout_release: "Returned (payment not completed)", refund_release: "Returned (refund)", grant: "Credit grant" };

  return (
    <>
      {welcome && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] px-4 py-3 text-sm text-gold-100"><PartyPopper className="h-4 w-4 text-gold-300" /> Payment verified — your membership is active.</div>}
      <PageHeader title="Membership" description="Manage your plan, renewals and credits." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="gold-border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase"><Crown className="h-3.5 w-3.5" /> Current plan</p>
              <h2 className="mt-2 text-3xl font-semibold text-ivory">{sub?.plan.name ?? "Free"}</h2>
              <p className="mt-1 text-sm text-fog">{sub?.plan.tagline}</p>
            </div>
            {sub && <StatusBadge status={sub.status} />}
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/25 p-3"><dt className="text-[10px] tracking-wide text-fog uppercase">Billing</dt><dd className="mt-1 text-sm text-ivory">{paid ? `${formatMoney(sub!.interval === "ANNUAL" ? sub!.plan.annualPriceMinor : sub!.plan.monthlyPriceMinor)} / ${sub!.interval === "ANNUAL" ? "year" : "month"}` : "—"}</dd></div>
            <div className="rounded-xl bg-black/25 p-3"><dt className="text-[10px] tracking-wide text-fog uppercase">{sub?.cancelAtPeriodEnd ? "Ends" : "Renews"}</dt><dd className="mt-1 text-sm text-ivory">{sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}</dd></div>
            <div className="rounded-xl bg-black/25 p-3"><dt className="text-[10px] tracking-wide text-fog uppercase">Benefits</dt><dd className="mt-1 text-sm text-ivory">{ent.plan.rentalDiscountBps / 100}% off · {ent.plan.maxConcurrentRentals} rentals</dd></div>
          </dl>
          {sub?.status === "PAST_DUE" && <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">Your last renewal failed. Benefits continue until {sub.graceUntil ? formatDateTime(sub.graceUntil) : "the grace period ends"} — update your payment to keep {sub.plan.name}.</p>}
          {sub?.cancelAtPeriodEnd && <p className="mt-4 text-sm text-mist">Cancellation scheduled — you’ll move to Free on {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "period end"}.</p>}
          {sub?.scheduledPlan && <p className="mt-4 text-sm text-mist">Switching to <span className="text-ivory">{sub.scheduledPlan.name}</span> on {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "renewal"}.</p>}
          <div className="mt-6">
            <SubscriptionActions paid={paid} cancelAtPeriodEnd={!!sub?.cancelAtPeriodEnd} scheduled={!!sub?.scheduledPlanId} pastDue={sub?.status === "PAST_DUE"} planCode={sub?.plan.code ?? "FREE"} interval={sub?.interval ?? "MONTHLY"} sandbox={isSandboxPayments()} simulateFailure={!!sub?.simulateRenewalFailure} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Credits" description="1 credit = ₹1 · up to 50% of a rental" action={<span className="flex items-center gap-1.5 text-xl font-semibold text-gold-200 tabular-nums"><Coins className="h-4 w-4" />{credits.toLocaleString("en-IN")}</span>} />
          <ul className="divide-y divide-white/[0.05] px-5 py-2 text-sm sm:px-6">
            {ledger.map((l) => (
              <li key={l.id} className="flex justify-between py-2.5">
                <span className="text-mist">{REASONS[l.reason] ?? l.reason.replace(/_/g, " ")}<span className="block text-xs text-fog">{formatDate(l.createdAt)}</span></span>
                <span className={l.delta > 0 ? "text-success tabular-nums" : "text-mist tabular-nums"}>{l.delta > 0 ? "+" : ""}{l.delta}</span>
              </li>
            ))}
            {ledger.length === 0 && <li className="py-6 text-center text-fog">No credit activity yet.</li>}
          </ul>
        </Panel>
      </div>
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-ivory">Change plan</h2>
        <p className="mt-1 text-sm text-fog">Upgrades apply now with credit for unused time. Downgrades apply at your next renewal.</p>
        <MembershipPlans plans={plans} currentPlanCode={ent.plan.code} signedIn />
      </section>
    </>
  );
}
