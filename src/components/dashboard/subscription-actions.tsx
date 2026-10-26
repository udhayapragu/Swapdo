"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

export function SubscriptionActions({ paid, cancelAtPeriodEnd, scheduled, pastDue, planCode, interval, sandbox, simulateFailure }: { paid: boolean; cancelAtPeriodEnd: boolean; scheduled: boolean; pastDue: boolean; planCode: string; interval: string; sandbox: boolean; simulateFailure: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function call(key: string, path: string, body?: unknown, success?: string) {
    setBusy(key);
    try {
      const res = await api<{ kind?: string; orderId?: string }>(path, { method: "POST", body });
      if (res?.kind === "requires_payment" && res.orderId) return router.push(`/checkout/${res.orderId}`);
      if (success) toast({ tone: "success", message: success });
      setConfirm(false);
      router.refresh();
    } catch (err) {
      toast({ tone: "error", message: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pastDue && <Button size="sm" onClick={() => call("pay", "/api/subscriptions/checkout", { planCode, interval })} loading={busy === "pay"}>Update payment</Button>}
      {paid && !cancelAtPeriodEnd && !pastDue && <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>Cancel membership</Button>}
      {(cancelAtPeriodEnd || scheduled) && <Button size="sm" variant="outline" onClick={() => call("resume", "/api/subscriptions/resume", undefined, "Your membership will continue as normal.")} loading={busy === "resume"}>{cancelAtPeriodEnd ? "Keep my membership" : "Cancel scheduled change"}</Button>}
      {sandbox && paid && (
        <label className="flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[0.06] px-3 py-1.5 text-xs text-violet-200">
          <input type="checkbox" className="accent-[#8a6cf0]" checked={simulateFailure} disabled={busy === "sandbox"} onChange={(e) => call("sandbox", "/api/subscriptions/sandbox", { simulateRenewalFailure: e.target.checked }, e.target.checked ? "Next renewal will fail (sandbox)." : "Renewals will succeed (sandbox).")} />
          Sandbox: fail next renewal
        </label>
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Cancel your membership?" description="You’ll keep every benefit until the end of the current billing period, then move to Free. Your rental history and wishlist stay intact.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Keep membership</Button>
          <Button variant="danger" onClick={() => call("cancel", "/api/subscriptions/cancel", undefined, "Membership will end at the close of this period.")} loading={busy === "cancel"}>Cancel at period end</Button>
        </div>
      </Dialog>
    </div>
  );
}
