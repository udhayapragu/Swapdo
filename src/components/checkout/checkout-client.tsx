"use client";

import { CircleCheck, CreditCard, FlaskConical, Lock, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";
import { api } from "@/lib/client";

type Props = {
  orderId: string;
  status: string;
  provider: "mock" | "razorpay";
  razorpay?: { key: string; providerOrderId: string; amountMinor: number; currency: string; name: string; email: string };
  successHref: string;
  canCancelRentalId?: string | null;
  totalLabel: string;
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutClient({ orderId, status: initialStatus, provider, razorpay, successHref, canCancelRentalId, totalLabel }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<"success" | "failure" | "retry" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate(outcome: "success" | "failure") {
    setBusy(outcome);
    setError(null);
    try {
      const res = await api<{ order: { status: string } }>("/api/payments/mock/complete", { body: { orderId, outcome } });
      setStatus(res.order.status);
      if (res.order.status === "PAID") setTimeout(() => router.push(successHref), 1400);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function retry() {
    setBusy("retry");
    try {
      await api(`/api/orders/${orderId}/retry`, { method: "POST" });
      setStatus("PENDING");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!canCancelRentalId) return;
    setBusy("cancel");
    try {
      await api(`/api/rentals/${canCancelRentalId}`, { method: "DELETE" });
      router.push("/dashboard/rentals");
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function payWithRazorpay() {
    if (!razorpay) return;
    setError(null);
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Could not load Razorpay."));
        document.body.appendChild(s);
      }).catch((e) => setError(e.message));
    }
    if (!window.Razorpay) return;
    new window.Razorpay({
      key: razorpay.key,
      order_id: razorpay.providerOrderId,
      amount: razorpay.amountMinor,
      currency: razorpay.currency,
      name: "SWAPDO",
      prefill: { name: razorpay.name, email: razorpay.email },
      theme: { color: "#c9a45f" },
      handler: async (resp: Record<string, string>) => {
        await api("/api/payments/razorpay/verify", { body: resp }).catch((e) => setError(e.message));
        // Fulfilment is driven by the signed webhook; poll briefly for the result.
        for (let i = 0; i < 10; i++) {
          const r = await api<{ order: { status: string } }>(`/api/orders/${orderId}`);
          if (r.order.status === "PAID") return router.push(successHref);
          await new Promise((res) => setTimeout(res, 1500));
        }
        router.refresh();
      },
    }).open();
  }

  return (
    <AnimatePresence mode="wait">
      {status === "PAID" ? (
        <motion.div key="paid" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
            <CircleCheck className="h-8 w-8" />
          </motion.div>
          <h2 className="mt-5 text-xl font-semibold text-ivory">Payment confirmed</h2>
          <p className="mt-1.5 text-sm text-fog">Verified on our server. Taking you there now…</p>
          <ButtonLink href={successHref} className="mt-6">Continue</ButtonLink>
        </motion.div>
      ) : status === "FAILED" ? (
        <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger/15 text-danger"><TriangleAlert className="h-7 w-7" /></div>
          <h2 className="mt-4 text-lg font-semibold text-ivory">Payment didn’t go through</h2>
          <p className="mt-1.5 text-sm text-fog">Nothing was charged and any credits were returned. You can try again.</p>
          <div className="mt-4"><FormError message={error} /></div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={retry} loading={busy === "retry"}>Try again</Button>
            {canCancelRentalId && <Button variant="ghost" onClick={cancel} loading={busy === "cancel"}>Cancel order</Button>}
          </div>
        </motion.div>
      ) : status === "PENDING" ? (
        <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {provider === "mock" ? (
            <>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-obsidian-700 via-obsidian-800 to-violet-900/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200"><FlaskConical className="h-3 w-3" /> Sandbox gateway</span>
                  <CreditCard className="h-5 w-5 text-gold-300" />
                </div>
                <p className="mt-8 font-mono text-lg tracking-[0.2em] text-ivory/80">•••• •••• •••• 4242</p>
                <p className="mt-2 text-xs text-fog">Simulated card — no card details are collected and no money moves.</p>
              </div>
              <div className="mt-4"><FormError message={error} /></div>
              <Button size="lg" className="mt-4 w-full" onClick={() => simulate("success")} loading={busy === "success"} disabled={!!busy}>
                <Lock className="h-4 w-4" /> Pay {totalLabel} (sandbox)
              </Button>
              <div className="mt-3 flex items-center justify-between text-xs">
                <button onClick={() => simulate("failure")} disabled={!!busy} className="text-fog underline-offset-4 hover:text-ivory hover:underline">Simulate a declined payment</button>
                {canCancelRentalId && <button onClick={cancel} disabled={!!busy} className="text-fog hover:text-ivory">Cancel</button>}
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-smoke">The sandbox signs a webhook exactly like a real gateway and sends it through SWAPDO’s production webhook handler (signature check, idempotency, fulfilment).</p>
            </>
          ) : (
            <>
              <div className="mt-2"><FormError message={error} /></div>
              <Button size="lg" className="mt-2 w-full" onClick={payWithRazorpay}><Lock className="h-4 w-4" /> Pay {totalLabel} with Razorpay</Button>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div key="other" className="py-6 text-center">
          <p className="text-sm text-fog">This order is {status.toLowerCase()}.</p>
          <Link href="/dashboard/billing" className="mt-4 inline-block text-sm text-gold-300">View billing</Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
