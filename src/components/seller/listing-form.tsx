"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { RENTAL_DURATIONS } from "@/config/durations";

type Option = { id: string; name: string };

export function ListingForm({ categories, authorizations }: { categories: Option[]; authorizations: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ name: "", tagline: "", description: "", categoryId: categories[0]?.id ?? "", authorizationId: authorizations[0]?.id ?? "", accessMethod: "OFFICIAL_API", features: "", tags: "", capacity: "" });
  const [plans, setPlans] = useState([{ durationMinutes: 60, price: "", usageLimit: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"submit" | "draft" | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save(submit: boolean) {
    setBusy(submit ? "submit" : "draft");
    setError(null);
    try {
      await api("/api/seller/listings", {
        body: {
          name: f.name, tagline: f.tagline, description: f.description, categoryId: f.categoryId, authorizationId: f.authorizationId, accessMethod: f.accessMethod,
          features: f.features.split("\n").map((s) => s.trim()).filter(Boolean),
          tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
          capacity: f.capacity ? Number(f.capacity) : null,
          plans: plans.map((p) => ({ durationMinutes: p.durationMinutes, priceMinor: Math.round(Number(p.price) * 100), usageLimit: p.usageLimit ? Number(p.usageLimit) : null })),
          submit,
        },
      });
      toast({ tone: "success", message: submit ? "Listing submitted for review." : "Draft saved." });
      router.push("/seller/listings");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  const unused = RENTAL_DURATIONS.filter((d) => !plans.some((p) => p.durationMinutes === d.minutes));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="space-y-6">
      <div className="glass space-y-4 rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ivory">Basics</h2>
        <Field label="Service name" htmlFor="l-name"><Input id="l-name" value={f.name} onChange={set("name")} required minLength={3} maxLength={80} /></Field>
        <Field label="Tagline" htmlFor="l-tagline" hint="One sentence, 10–140 characters"><Input id="l-tagline" value={f.tagline} onChange={set("tagline")} required minLength={10} maxLength={140} /></Field>
        <Field label="Description" htmlFor="l-desc" hint="What customers get, how access works, and any limits (40+ characters)"><Textarea id="l-desc" value={f.description} onChange={set("description")} required minLength={40} className="min-h-36" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="l-cat"><Select id="l-cat" value={f.categoryId} onChange={set("categoryId")}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Access method" htmlFor="l-access">
            <Select id="l-access" value={f.accessMethod} onChange={set("accessMethod")}>
              <option value="OFFICIAL_API">Official API</option>
              <option value="OAUTH">OAuth (delegated sign-in)</option>
              <option value="PROVIDER_TOKEN">Provider-issued token</option>
              <option value="MANAGED_SERVICE">Managed service</option>
            </Select>
          </Field>
        </div>
        <Field label="Authorization" htmlFor="l-auth" hint="The approved authorization that allows you to offer this service">
          <Select id="l-auth" value={f.authorizationId} onChange={set("authorizationId")}>{authorizations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Key features" htmlFor="l-features" hint="One per line (1–8)"><Textarea id="l-features" value={f.features} onChange={set("features")} required /></Field>
          <div className="space-y-4">
            <Field label="Search tags" htmlFor="l-tags" hint="Comma separated"><Input id="l-tags" value={f.tags} onChange={set("tags")} /></Field>
            <Field label="Concurrent capacity" htmlFor="l-cap" hint="Optional — max simultaneous rentals"><Input id="l-cap" type="number" min={1} value={f.capacity} onChange={set("capacity")} /></Field>
          </div>
        </div>
      </div>

      <div className="glass space-y-4 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ivory">Rental options</h2>
          {unused.length > 0 && <Button size="sm" variant="ghost" onClick={() => setPlans((p) => [...p, { durationMinutes: unused[0]!.minutes, price: "", usageLimit: "" }])}><Plus className="h-4 w-4" /> Add duration</Button>}
        </div>
        {plans.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
            <Field label="Duration" htmlFor={`p-d-${i}`} className="col-span-3 sm:col-span-1">
              <Select id={`p-d-${i}`} value={p.durationMinutes} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, durationMinutes: Number(e.target.value) } : x)))}>
                {RENTAL_DURATIONS.filter((d) => d.minutes === p.durationMinutes || !plans.some((x) => x.durationMinutes === d.minutes)).map((d) => <option key={d.minutes} value={d.minutes}>{d.label}</option>)}
              </Select>
            </Field>
            <Field label="Price (₹)" htmlFor={`p-p-${i}`}><Input id={`p-p-${i}`} type="number" min={10} step="1" value={p.price} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} required /></Field>
            <Field label="Usage limit" htmlFor={`p-u-${i}`}><Input id={`p-u-${i}`} type="number" min={1} placeholder="Fair use" value={p.usageLimit} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, usageLimit: e.target.value } : x)))} /></Field>
            <button type="button" onClick={() => setPlans((ps) => ps.filter((_, j) => j !== i))} disabled={plans.length === 1} className="mb-1 grid h-10 w-10 place-items-center rounded-full text-fog hover:bg-white/5 hover:text-danger disabled:opacity-30" aria-label="Remove duration"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={busy === "submit"} disabled={!!busy}>Submit for review</Button>
        <Button variant="glass" onClick={() => save(false)} loading={busy === "draft"} disabled={!!busy}>Save draft</Button>
      </div>
    </form>
  );
}
