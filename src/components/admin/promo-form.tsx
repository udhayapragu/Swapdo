"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

export function PromoForm() {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ code: "", description: "", percentOff: "10", maxRedemptions: "", expiresAt: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setLoading(true); setError(null);
      try {
        await api("/api/admin/promos", { body: { code: f.code, description: f.description, percentOff: Number(f.percentOff), maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : null, expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null } });
        toast({ tone: "success", message: "Promo code created" }); setF({ code: "", description: "", percentOff: "10", maxRedemptions: "", expiresAt: "" }); router.refresh();
      } catch (err) { setError((err as Error).message); }
      setLoading(false);
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Code" htmlFor="pc-code"><Input id="pc-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} required pattern="[A-Z0-9]{3,20}" /></Field>
        <Field label="Percent off" htmlFor="pc-pct"><Input id="pc-pct" type="number" min={1} max={90} value={f.percentOff} onChange={set("percentOff")} required /></Field>
      </div>
      <Field label="Description" htmlFor="pc-desc"><Input id="pc-desc" value={f.description} onChange={set("description")} maxLength={120} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Max redemptions" htmlFor="pc-max" hint="Blank = unlimited"><Input id="pc-max" type="number" min={1} value={f.maxRedemptions} onChange={set("maxRedemptions")} /></Field>
        <Field label="Expires" htmlFor="pc-exp" hint="Optional"><Input id="pc-exp" type="date" value={f.expiresAt} onChange={set("expiresAt")} /></Field>
      </div>
      <FormError message={error} />
      <Button type="submit" loading={loading}>Create code</Button>
    </form>
  );
}
