"use client";

import { Check, Crown } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api, ClientApiError } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type PlanView = {
  code: string;
  name: string;
  tagline: string;
  monthlyPriceMinor: number;
  annualPriceMinor: number;
  monthlyCredits: number;
  maxConcurrentRentals: number;
  rentalDiscountBps: number;
  features: string[];
  highlighted: boolean;
};

export function MembershipPlans({ plans, currentPlanCode, signedIn }: { plans: PlanView[]; currentPlanCode?: string | null; signedIn: boolean }) {
  const [interval, setInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const maxSaving = Math.max(...plans.filter((p) => p.monthlyPriceMinor > 0).map((p) => 1 - p.annualPriceMinor / (p.monthlyPriceMinor * 12)));

  async function choose(plan: PlanView) {
    if (!signedIn) return router.push(`/register?next=${encodeURIComponent("/memberships")}`);
    if (plan.code === "FREE" && !currentPlanCode) return router.push("/marketplace");
    setBusy(plan.code);
    try {
      const res = await api<{ kind: "requires_payment"; orderId: string } | { kind: "scheduled"; planName: string; effectiveAt: string | null }>("/api/subscriptions/checkout", {
        body: { planCode: plan.code, interval },
      });
      if (res.kind === "requires_payment") router.push(`/checkout/${res.orderId}`);
      else {
        toast({ tone: "success", message: `Switch to ${res.planName} scheduled for the end of your billing period.` });
        router.push("/dashboard/subscription");
      }
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 401) router.push("/login?next=/memberships");
      else toast({ tone: "error", message: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mx-auto mt-10 flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] p-1" role="radiogroup" aria-label="Billing interval">
        {(["MONTHLY", "ANNUAL"] as const).map((i) => (
          <button key={i} role="radio" aria-checked={interval === i} onClick={() => setInterval(i)} className={cn("relative rounded-full px-5 py-2 text-sm font-medium transition-colors", interval === i ? "text-obsidian-950" : "text-mist hover:text-ivory")}>
            {interval === i && <motion.span layoutId="interval-pill" className="absolute inset-0 -z-0 rounded-full bg-gradient-to-b from-gold-300 to-gold-500" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <span className="relative">{i === "MONTHLY" ? "Monthly" : "Annual"}</span>
            {i === "ANNUAL" && maxSaving > 0 && <span className={cn("relative ml-2 text-[11px] font-semibold", interval === i ? "text-obsidian-900" : "text-gold-300")}>save {Math.round(maxSaving * 100)}%</span>}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = interval === "ANNUAL" ? plan.annualPriceMinor : plan.monthlyPriceMinor;
          const perMonth = interval === "ANNUAL" ? Math.round(plan.annualPriceMinor / 12) : plan.monthlyPriceMinor;
          const current = currentPlanCode === plan.code;
          return (
            <div key={plan.code} className={cn("relative flex flex-col rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1", plan.highlighted ? "gold-border bg-gradient-to-b from-gold-400/[0.09] to-violet-600/[0.05] shadow-gold" : "glass")}>
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-3 py-1 text-[11px] font-bold text-obsidian-950">
                  <Crown className="h-3 w-3" /> Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-ivory">{plan.name}</h3>
              <p className="mt-1.5 min-h-10 text-sm text-fog">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-ivory tabular-nums">{formatMoney(perMonth)}</span>
                <span className="text-sm text-fog">/ month</span>
              </div>
              <p className="mt-1 h-5 text-xs text-fog">{price > 0 && interval === "ANNUAL" ? `${formatMoney(price)} billed yearly` : price > 0 ? "Billed monthly · cancel anytime" : "Free forever"}</p>

              <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border hairline bg-black/20 p-3 text-center">
                <div><dt className="text-[10px] tracking-wide text-fog uppercase">Credits</dt><dd className="mt-0.5 text-sm font-semibold text-ivory tabular-nums">{plan.monthlyCredits.toLocaleString("en-IN")}<span className="text-[10px] font-normal text-fog">/mo</span></dd></div>
                <div><dt className="text-[10px] tracking-wide text-fog uppercase">Discount</dt><dd className="mt-0.5 text-sm font-semibold text-ivory">{plan.rentalDiscountBps / 100}%</dd></div>
                <div><dt className="text-[10px] tracking-wide text-fog uppercase">Rentals</dt><dd className="mt-0.5 text-sm font-semibold text-ivory">{plan.maxConcurrentRentals}</dd></div>
              </dl>

              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-mist">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Button className="w-full" variant={plan.highlighted ? "gold" : "glass"} onClick={() => choose(plan)} loading={busy === plan.code} disabled={current}>
                  {current ? "Current plan" : plan.code === "FREE" ? (currentPlanCode ? "Downgrade to Free" : "Start free") : `Choose ${plan.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-fog">1 credit = ₹1, redeemable for up to 50% of any rental. Usage limits are set per service and shown before you pay. Prices include GST where applicable.</p>
    </div>
  );
}
