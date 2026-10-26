"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

function useSaver() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  async function save(key: string, path: string, method: "PATCH" | "POST", body: unknown, msg = "Saved") {
    setBusy(key);
    try {
      await api(path, { method, body });
      toast({ tone: "success", message: msg });
      router.refresh();
    } catch (err) {
      toast({ tone: "error", message: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }
  return { busy, save };
}

export function PlatformSettingsForm({ commissionRateBps, minimumPayoutMinor, refundWindowHours }: { commissionRateBps: number; minimumPayoutMinor: number; refundWindowHours: number }) {
  const { busy, save } = useSaver();
  const [f, setF] = useState({ commission: String(commissionRateBps / 100), payout: String(minimumPayoutMinor / 100), refund: String(refundWindowHours) });
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save("settings", "/api/admin/settings", "PATCH", { commissionRateBps: Math.round(Number(f.commission) * 100), minimumPayoutMinor: Math.round(Number(f.payout) * 100), refundWindowHours: Number(f.refund) }, "Platform settings saved"); }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Commission (%)" htmlFor="st-c"><Input id="st-c" type="number" step="0.5" min={0} max={50} value={f.commission} onChange={(e) => setF({ ...f, commission: e.target.value })} /></Field>
        <Field label="Minimum payout (₹)" htmlFor="st-p"><Input id="st-p" type="number" min={0} value={f.payout} onChange={(e) => setF({ ...f, payout: e.target.value })} /></Field>
        <Field label="Refund window (hours)" htmlFor="st-r"><Input id="st-r" type="number" min={0} value={f.refund} onChange={(e) => setF({ ...f, refund: e.target.value })} /></Field>
      </div>
      <p className="text-xs text-fog">Commission changes apply to new orders only. Individual sellers can have an override.</p>
      <Button type="submit" loading={busy === "settings"}>Save settings</Button>
    </form>
  );
}

export function FlagToggle({ flagKey, enabled, description }: { flagKey: string; enabled: boolean; description: string }) {
  const { busy, save } = useSaver();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-sm text-ivory">{flagKey}</p>
        <p className="text-xs text-fog">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${flagKey}`}
        disabled={busy !== null}
        onClick={() => save(flagKey, `/api/admin/flags/${flagKey}`, "PATCH", { enabled: !enabled }, `${flagKey} ${enabled ? "disabled" : "enabled"}`)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", enabled ? "bg-gold-400" : "bg-white/10")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-5.5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

type Plan = { code: string; name: string; monthlyPriceMinor: number; annualPriceMinor: number; monthlyCredits: number; maxConcurrentRentals: number; rentalDiscountBps: number; active: boolean };

export function PlanEditor({ plan }: { plan: Plan }) {
  const { busy, save } = useSaver();
  const [f, setF] = useState({ monthly: String(plan.monthlyPriceMinor / 100), annual: String(plan.annualPriceMinor / 100), credits: String(plan.monthlyCredits), rentals: String(plan.maxConcurrentRentals), discount: String(plan.rentalDiscountBps / 100), active: plan.active });
  const id = (k: string) => `${plan.code}-${k}`;
  return (
    <form className="glass space-y-3 rounded-2xl p-5" onSubmit={(e) => { e.preventDefault(); save(plan.code, `/api/admin/plans/${plan.code}`, "PATCH", { monthlyPriceMinor: Math.round(Number(f.monthly) * 100), annualPriceMinor: Math.round(Number(f.annual) * 100), monthlyCredits: Number(f.credits), maxConcurrentRentals: Number(f.rentals), rentalDiscountBps: Math.round(Number(f.discount) * 100), active: f.active }, `${plan.name} updated`); }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ivory">{plan.name}</h3>
        {plan.code !== "FREE" && <label className="flex items-center gap-2 text-xs text-fog"><input type="checkbox" className="accent-[#c9a45f]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Offered</label>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly (₹)" htmlFor={id("m")}><Input id={id("m")} type="number" min={0} value={f.monthly} onChange={(e) => setF({ ...f, monthly: e.target.value })} className="h-10" disabled={plan.code === "FREE"} /></Field>
        <Field label="Annual (₹)" htmlFor={id("a")}><Input id={id("a")} type="number" min={0} value={f.annual} onChange={(e) => setF({ ...f, annual: e.target.value })} className="h-10" disabled={plan.code === "FREE"} /></Field>
        <Field label="Credits / month" htmlFor={id("c")}><Input id={id("c")} type="number" min={0} value={f.credits} onChange={(e) => setF({ ...f, credits: e.target.value })} className="h-10" /></Field>
        <Field label="Max rentals" htmlFor={id("r")}><Input id={id("r")} type="number" min={1} value={f.rentals} onChange={(e) => setF({ ...f, rentals: e.target.value })} className="h-10" /></Field>
        <Field label="Rental discount (%)" htmlFor={id("d")} className="col-span-2"><Input id={id("d")} type="number" step="0.5" min={0} max={50} value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} className="h-10" /></Field>
      </div>
      <Button type="submit" size="sm" variant="glass" loading={busy === plan.code}>Save {plan.name}</Button>
    </form>
  );
}
