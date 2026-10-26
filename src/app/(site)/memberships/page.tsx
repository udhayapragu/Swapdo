import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { MembershipPlans } from "@/components/marketing/membership-plans";
import { SectionHeading } from "@/components/marketing/section-heading";
import { getMembershipPlans } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Memberships",
  description: "Save on every rental with SWAPDO Starter, Pro and Elite memberships — monthly credits, member discounts and more concurrent rentals.",
  alternates: { canonical: "/memberships" },
};

const FAQ = [
  { q: "What are credits?", a: "Credits are included with paid memberships each billing period. 1 credit = ₹1 and can cover up to 50% of any rental at checkout. Annual plans receive the full year’s credits upfront." },
  { q: "Can I change plans anytime?", a: "Yes. Upgrades take effect immediately and the unused value of your current period is credited against the new plan. Downgrades take effect at the end of your billing period." },
  { q: "What happens if a renewal payment fails?", a: "Your plan moves to “past due” and your benefits continue during the plan’s grace period while we retry. If payment still fails, your account moves to Free — your rental history is kept." },
  { q: "Is usage unlimited?", a: "No. Each rental lists its included usage up front, and membership limits are shown on every plan. We don’t advertise unlimited usage that providers can’t sustain." },
  { q: "How do I cancel?", a: "Cancel from your dashboard in two clicks. You keep your benefits until the end of the period you’ve paid for." },
];

export default async function MembershipsPage() {
  const user = await getCurrentUser();
  const [plans, ent] = await Promise.all([getMembershipPlans(), user ? getEntitlements(user.id) : null]);
  const rows: { label: string; value: (p: (typeof plans)[number]) => React.ReactNode }[] = [
    { label: "Monthly price", value: (p) => (p.monthlyPriceMinor ? formatMoney(p.monthlyPriceMinor) : "Free") },
    { label: "Annual price", value: (p) => (p.annualPriceMinor ? formatMoney(p.annualPriceMinor) : "—") },
    { label: "Credits per month", value: (p) => p.monthlyCredits.toLocaleString("en-IN") },
    { label: "Discount on rentals", value: (p) => `${p.rentalDiscountBps / 100}%` },
    { label: "Concurrent rentals", value: (p) => p.maxConcurrentRentals },
    { label: "Payment grace period", value: (p) => (p.gracePeriodDays ? `${p.gracePeriodDays} days` : <Minus className="mx-auto h-4 w-4 text-smoke" />) },
    { label: "Priority support", value: (p) => (p.sortOrder >= 2 ? <Check className="mx-auto h-4 w-4 text-gold-300" /> : <Minus className="mx-auto h-4 w-4 text-smoke" />) },
  ];

  return (
    <div className="pt-28 lg:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(201_164_95/0.14),transparent)]" aria-hidden />
      <section className="container-page">
        <SectionHeading eyebrow="Memberships" title="Membership," accent="refined." body="Every plan is transparent: what you pay, the credits you receive, the discount you get and how many services you can run at once." />
        <h1 className="sr-only">SWAPDO memberships</h1>
        <MembershipPlans plans={plans} currentPlanCode={ent?.plan.code ?? null} signedIn={!!user} />
      </section>

      <section className="container-page mt-28">
        <h2 className="text-2xl font-semibold text-ivory">Compare plans</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border hairline">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b hairline bg-white/[0.02]">
                <th scope="col" className="px-5 py-4 text-left font-medium text-fog">Feature</th>
                {plans.map((p) => <th key={p.code} scope="col" className={`px-5 py-4 text-center font-semibold ${p.highlighted ? "text-gold-200" : "text-ivory"}`}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b hairline last:border-0">
                  <th scope="row" className="px-5 py-4 text-left font-normal text-mist">{r.label}</th>
                  {plans.map((p) => <td key={p.code} className="px-5 py-4 text-center text-ivory tabular-nums">{r.value(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container-page mt-24 max-w-3xl">
        <h2 className="text-2xl font-semibold text-ivory">Questions</h2>
        <div className="mt-6 divide-y divide-white/[0.06] rounded-2xl border hairline">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ivory">
                {f.q}
                <span className="text-gold-300 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-fog">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
