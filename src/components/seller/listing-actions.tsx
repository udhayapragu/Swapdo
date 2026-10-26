"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { durationLabel } from "@/config/durations";

type Plan = { id: string; durationMinutes: number; priceMinor: number; active: boolean };

export function ListingActions({ id, status, plans }: { id: string; status: string; plans: Plan[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(plans.map((p) => ({ ...p, price: String(p.priceMinor / 100) })));
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(key: string, body: unknown, msg: string) {
    setBusy(key);
    try {
      await api(`/api/seller/listings/${id}`, { method: "PATCH", body });
      toast({ tone: "success", message: msg });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ tone: "error", message: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {status !== "SUSPENDED" && <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Pricing</Button>}
      {status === "APPROVED" && <Button size="sm" variant="ghost" loading={busy === "pause"} onClick={() => patch("pause", { action: "pause" }, "Listing paused (moved to draft).")}>Pause</Button>}
      {(status === "DRAFT" || status === "REJECTED") && <Button size="sm" variant="outline" loading={busy === "submit"} onClick={() => patch("submit", { action: "submit" }, "Submitted for review.")}>Submit</Button>}
      <Dialog open={open} onClose={() => setOpen(false)} title="Pricing & availability" description="Price changes apply to new rentals immediately.">
        <div className="space-y-3">
          {draft.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-3">
              <span className="text-sm text-mist">{durationLabel(p.durationMinutes)}</span>
              <label className="sr-only" htmlFor={`price-${p.id}`}>Price for {durationLabel(p.durationMinutes)}</label>
              <Input id={`price-${p.id}`} type="number" min={10} value={p.price} onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} className="h-10" />
              <label className="flex items-center gap-2 text-xs text-fog"><input type="checkbox" className="accent-[#c9a45f]" checked={p.active} onChange={(e) => setDraft((d) => d.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} /> On</label>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={busy === "plans"} onClick={() => patch("plans", { plans: draft.map((p) => ({ id: p.id, priceMinor: Math.round(Number(p.price) * 100), active: p.active })) }, "Pricing updated.")}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}
