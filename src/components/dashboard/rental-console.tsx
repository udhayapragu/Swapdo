"use client";

import { AnimatePresence, motion } from "motion/react";
import { KeyRound, Play, RefreshCw, RotateCcw, Send, ShieldCheck, Terminal, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormError, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { formatRemaining } from "@/components/ui/countdown";
import { api } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { durationLabel } from "@/config/durations";
import { cn } from "@/lib/utils";

type Plan = { id: string; durationMinutes: number; priceMinor: number };

/** Animated ring countdown anchored to the server clock. */
export function CountdownRing({ startsAt, endsAt, serverNow, live }: { startsAt: string | null; endsAt: string | null; serverNow: string; live: boolean }) {
  const router = useRouter();
  const offset = useRef(new Date(serverNow).getTime() - Date.now());
  const total = startsAt && endsAt ? new Date(endsAt).getTime() - new Date(startsAt).getTime() : 1;
  const calc = () => (endsAt ? new Date(endsAt).getTime() - (Date.now() + offset.current) : 0);
  const [left, setLeft] = useState(() => (endsAt ? new Date(endsAt).getTime() - new Date(serverNow).getTime() : 0));
  const refreshed = useRef(false);

  useEffect(() => {
    offset.current = new Date(serverNow).getTime() - Date.now();
    if (!live) return;
    const id = setInterval(() => {
      const l = calc();
      setLeft(l);
      if (l <= 0 && !refreshed.current) {
        refreshed.current = true;
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, serverNow, live]);

  const frac = live ? Math.max(0, Math.min(1, left / total)) : 0;
  const R = 92, C = 2 * Math.PI * R;
  const warn = live && left < Math.max(15 * 60_000, total * 0.1);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={warn ? "#f0c060" : "#f3e3bd"} />
            <stop offset="1" stopColor={warn ? "#f07a7a" : "#8a6cf0"} />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r={R} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="10" />
        <circle cx="110" cy="110" r={R} fill="none" stroke="url(#ring)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] tracking-[0.2em] text-fog uppercase">{live ? "Time remaining" : "Access"}</span>
        <span className={cn("mt-1 font-mono text-3xl tabular-nums sm:text-[2.1rem]", warn ? "text-warning" : "text-ivory")} suppressHydrationWarning>{live ? formatRemaining(left) : "—"}</span>
        <span className="mt-1 text-xs text-fog">{live ? `${Math.round(frac * 100)}% left` : "Not active"}</span>
      </div>
    </div>
  );
}

export function RentalConsole({
  rentalId, live, pending, usageUnit, usageCount, usageLimit, plans, refundable, simulated, accessMethod,
}: {
  rentalId: string; live: boolean; pending: boolean; usageUnit: string; usageCount: number; usageLimit: number | null; plans: Plan[];
  refundable: { orderId: string } | null; simulated: boolean; accessMethod: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [session, setSession] = useState<{ token: string; expiresAt: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function run<T>(key: string, fn: () => Promise<T>) {
    setBusy(key);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const launch = () =>
    run("launch", async () => {
      const res = await api<{ grant: { token: string; expiresAt: string }; serverTime: string }>(`/api/rentals/${rentalId}/access`, { method: "POST" });
      setSession(res.grant);
      setLog((l) => [`${new Date(res.serverTime).toLocaleTimeString()} · access verified by server · grant valid until ${new Date(res.grant.expiresAt).toLocaleTimeString()}`, ...l]);
    });

  const sendRequest = () =>
    run("use", async () => {
      await api(`/api/rentals/${rentalId}/usage`, { body: { units: 1, action: "request" } });
      setLog((l) => [`${new Date().toLocaleTimeString()} · 1 ${usageUnit.replace(/s$/, "")} recorded`, ...l].slice(0, 8));
      router.refresh();
    });

  const extend = (planId: string) =>
    run(`extend-${planId}`, async () => {
      const res = await api<{ orderId: string }>(`/api/rentals/${rentalId}/extend`, { body: { planId } });
      router.push(`/checkout/${res.orderId}`);
    });

  const cancel = () =>
    run("cancel", async () => {
      await api(`/api/rentals/${rentalId}`, { method: "DELETE" });
      toast({ tone: "success", message: "Rental cancelled." });
      router.refresh();
    });

  const requestRefund = () =>
    run("refund", async () => {
      await api("/api/refunds", { body: { orderId: refundable!.orderId, reason } });
      setRefundOpen(false);
      toast({ tone: "success", message: "Refund requested. We’ll review it within one business day." });
      router.refresh();
    });

  const exhausted = usageLimit !== null && usageCount >= usageLimit;

  return (
    <div className="space-y-6">
      <FormError message={error} />

      {pending && (
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-mist">This rental is waiting for payment. Access starts only after the payment is verified.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="danger" size="sm" onClick={cancel} loading={busy === "cancel"}>Cancel rental</Button>
          </div>
        </div>
      )}

      {live && (
        <div className="glass overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ivory"><Terminal className="h-4 w-4 text-gold-300" /> Service console</div>
            {simulated && <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300 uppercase">Simulated access</span>}
          </div>
          <div className="p-5">
            {!session ? (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-fog">Launching asks the server to verify your rental window and usage, then issues a short-lived access grant ({accessMethod.replace(/_/g, " ").toLowerCase()}).</p>
                <Button onClick={launch} loading={busy === "launch"} disabled={exhausted}><Play className="h-4 w-4" /> Launch</Button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/[0.06] p-3 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div className="min-w-0">
                      <p className="text-ivory">Access granted</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-fog"><KeyRound className="h-3 w-3 shrink-0" /> {session.token.slice(0, 28)}…</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={sendRequest} loading={busy === "use"} disabled={exhausted}><Send className="h-4 w-4" /> Send a request</Button>
                    <Button size="sm" variant="glass" onClick={launch} loading={busy === "launch"}><RefreshCw className="h-4 w-4" /> Refresh grant</Button>
                  </div>
                  {exhausted && <p className="flex items-center gap-2 text-sm text-warning"><TriangleAlert className="h-4 w-4" /> Included usage is used up. Extend to continue.</p>}
                </motion.div>
              </AnimatePresence>
            )}
            {log.length > 0 && (
              <ul className="mt-5 space-y-1 rounded-xl bg-black/30 p-3 font-mono text-[11px] text-fog" aria-live="polite">
                {log.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {plans.length > 0 && !pending && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-ivory">{live ? "Extend this rental" : "Renew"}</h2>
          <p className="mt-1 text-xs text-fog">{live ? "Extra time is added on top of what’s left — you never lose remaining time." : "Start a new rental of this service."}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {plans.map((p) => (
              <button key={p.id} onClick={() => extend(p.id)} disabled={!!busy} className="rounded-xl border border-white/10 p-3 text-left transition-colors hover:border-gold-400/50 hover:bg-gold-400/[0.04] disabled:opacity-50">
                <span className="block text-xs text-fog">+{durationLabel(p.durationMinutes)}</span>
                <span className="mt-0.5 block font-semibold text-ivory tabular-nums">{formatMoney(p.priceMinor)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {refundable && (
        <button onClick={() => setRefundOpen(true)} className="flex items-center gap-2 text-sm text-fog hover:text-ivory"><RotateCcw className="h-4 w-4" /> Something wrong? Request a refund</button>
      )}
      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} title="Request a refund" description="Tell us what went wrong. Requests are reviewed within one business day.">
        <Field label="Reason" htmlFor="refund-reason" hint="At least 10 characters"><Textarea id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} minLength={10} maxLength={500} /></Field>
        <div className="mt-4"><FormError message={error} /></div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
          <Button onClick={requestRefund} loading={busy === "refund"} disabled={reason.trim().length < 10}>Submit request</Button>
        </div>
      </Dialog>
    </div>
  );
}
