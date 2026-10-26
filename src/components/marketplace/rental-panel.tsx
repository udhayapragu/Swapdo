"use client";

import { CalendarClock, Check, Coins, Lock, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";
import { api, ClientApiError } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { quote, CREDIT_VALUE_MINOR } from "@/lib/pricing";
import { durationLabel } from "@/config/durations";
import { cn, formatDateTime } from "@/lib/utils";

type Plan = { id: string; durationMinutes: number; priceMinor: number; usageLimit: number | null; usageUnit: string };

export function RentalPanel({
  plans,
  signedIn,
  memberDiscountBps,
  planName,
  credits,
  maxCreditShare,
  serverNow,
  available,
  creditsEnabled,
}: {
  plans: Plan[];
  signedIn: boolean;
  memberDiscountBps: number;
  planName: string | null;
  credits: number;
  maxCreditShare: number;
  serverNow: string;
  available: boolean;
  creditsEnabled: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(plans[0]?.id);
  const [useCredits, setUseCredits] = useState(false);
  const [promo, setPromo] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const plan = plans.find((p) => p.id === selected);

  // Display-only estimate; the server recomputes everything at checkout.
  const q = useMemo(
    () => plan && quote({ basePriceMinor: plan.priceMinor, membershipDiscountBps: memberDiscountBps, creditsAvailable: credits, useCredits, maxCreditShare }),
    [plan, memberDiscountBps, credits, useCredits, maxCreditShare],
  );
  const endsAt = plan ? new Date(new Date(serverNow).getTime() + plan.durationMinutes * 60_000) : null;

  async function rent() {
    if (!plan) return;
    if (!signedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ orderId: string }>("/api/rentals", { body: { planId: plan.id, useCredits, promoCode: promo.trim() || undefined } });
      router.push(`/checkout/${res.orderId}`);
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 401) router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
      else setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="glass gold-border rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ivory">Choose your access</h2>
        {planName && memberDiscountBps > 0 && <span className="rounded-full bg-gold-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold-200">{planName} · {memberDiscountBps / 100}% off</span>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Rental duration">
        {plans.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(p.id)}
              className={cn("relative rounded-2xl border p-3 text-left transition-colors", active ? "border-gold-400/70 bg-gold-400/[0.07]" : "border-white/10 hover:border-white/20")}
            >
              {active && (
                <motion.span layoutId="plan-check" className="absolute top-2.5 right-2.5 grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-obsidian-950">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.span>
              )}
              <span className="block text-[13px] font-medium text-mist">{durationLabel(p.durationMinutes)}</span>
              <span className="mt-1 block text-lg font-semibold text-ivory tabular-nums">{formatMoney(p.priceMinor)}</span>
              <span className="mt-0.5 block text-[11px] text-fog">{p.usageLimit ? `${p.usageLimit.toLocaleString("en-IN")} ${p.usageUnit}` : "Fair-use access"}</span>
            </button>
          );
        })}
      </div>

      {plan && endsAt && (
        <div className="mt-4 flex gap-3 rounded-2xl border hairline bg-black/20 p-3 text-xs text-mist">
          <CalendarClock className="h-4 w-4 shrink-0 text-gold-300" />
          <p>
            Access starts the moment payment is confirmed and ends automatically after <span className="text-ivory">{durationLabel(plan.durationMinutes)}</span> — e.g. around <span className="text-ivory" suppressHydrationWarning>{formatDateTime(endsAt)}</span> if you start now.
          </p>
        </div>
      )}

      {signedIn && creditsEnabled && credits > 0 && (
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm">
          <span className="flex items-center gap-2 text-mist">
            <Coins className="h-4 w-4 text-gold-300" /> Use credits <span className="text-xs text-fog">({credits.toLocaleString("en-IN")} available)</span>
          </span>
          <input type="checkbox" className="h-4 w-4 accent-[#c9a45f]" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} />
        </label>
      )}

      <div className="mt-3">
        {showPromo ? (
          <div className="flex gap-2">
            <label htmlFor="promo" className="sr-only">Promo code</label>
            <input id="promo" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="Promo code" className="h-10 flex-1 rounded-xl border border-white/10 bg-obsidian-850/80 px-3 text-sm text-ivory uppercase placeholder:normal-case placeholder:text-smoke focus:border-gold-400/60 focus:outline-none" maxLength={32} />
          </div>
        ) : (
          <button onClick={() => setShowPromo(true)} className="flex items-center gap-1.5 text-xs text-gold-300 hover:text-gold-200">
            <Tag className="h-3.5 w-3.5" /> Have a promo code?
          </button>
        )}
      </div>

      {q && (
        <dl className="mt-5 space-y-2 border-t hairline pt-4 text-sm">
          <div className="flex justify-between text-mist"><dt>Price</dt><dd className="tabular-nums">{formatMoney(q.subtotalMinor)}</dd></div>
          {q.discountMinor > 0 && <div className="flex justify-between text-success"><dt>Member discount</dt><dd className="tabular-nums">−{formatMoney(q.discountMinor, true)}</dd></div>}
          {q.creditsApplied > 0 && <div className="flex justify-between text-gold-200"><dt>Credits</dt><dd className="tabular-nums">−{formatMoney(q.creditsApplied * CREDIT_VALUE_MINOR)}</dd></div>}
          {promo && <div className="flex justify-between text-fog"><dt>Promo {promo}</dt><dd>applied at checkout</dd></div>}
          <div className="flex justify-between pt-1 text-base font-semibold text-ivory"><dt>Total</dt><dd className="tabular-nums">{formatMoney(q.totalMinor, true)}</dd></div>
        </dl>
      )}

      <div className="mt-4"><FormError message={error} /></div>
      <Button size="lg" className="mt-3 w-full" onClick={rent} loading={loading} disabled={!plan || !available}>
        {!available ? "Fully booked" : signedIn ? "Rent now" : "Sign in to rent"}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-fog">
        <Lock className="h-3 w-3" /> Server-verified checkout · Sandbox payments in this build
      </p>
    </div>
  );
}
