"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

export function SellerApplyForm() {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ displayName: "", bio: "", website: "", kind: "OWN_SERVICE", title: "", reference: "", documentUrl: "", accept: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/seller/apply", {
        body: {
          displayName: f.displayName, bio: f.bio, website: f.website, country: "IN", acceptPolicy: f.accept,
          authorization: { kind: f.kind, title: f.title, reference: f.reference, documentUrl: f.documentUrl },
        },
      });
      toast({ tone: "success", message: "Application submitted. We’ll review it within 2 business days." });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Provider / business name" htmlFor="displayName"><Input id="displayName" value={f.displayName} onChange={set("displayName")} required minLength={2} maxLength={60} /></Field>
        <Field label="Website" htmlFor="website" hint="Optional"><Input id="website" type="url" placeholder="https://" value={f.website} onChange={set("website")} /></Field>
      </div>
      <Field label="About your services" htmlFor="bio" hint="20–600 characters"><Textarea id="bio" value={f.bio} onChange={set("bio")} required minLength={20} maxLength={600} /></Field>
      <fieldset className="space-y-4 rounded-2xl border hairline p-4">
        <legend className="px-1 text-sm font-semibold text-ivory">Authorization</legend>
        <p className="text-xs text-fog">Tell us how you’re legally allowed to offer time-based access. Listings can only go live against an approved authorization.</p>
        <Field label="Type" htmlFor="kind">
          <Select id="kind" value={f.kind} onChange={set("kind")}>
            <option value="OWN_SERVICE">I own and operate the service</option>
            <option value="OFFICIAL_API">Official API / partner programme</option>
            <option value="RESELLER_AGREEMENT">Authorised reseller agreement</option>
            <option value="CONTENT_LICENSE">Content distribution licence</option>
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title"><Input id="title" placeholder="e.g. Partner programme membership" value={f.title} onChange={set("title")} required minLength={3} /></Field>
          <Field label="Reference number" htmlFor="reference"><Input id="reference" placeholder="Agreement / licence ID" value={f.reference} onChange={set("reference")} required minLength={3} /></Field>
        </div>
        <Field label="Supporting document link" htmlFor="documentUrl" hint="Optional — a secure link to your agreement or licence. Never upload passwords."><Input id="documentUrl" type="url" value={f.documentUrl} onChange={set("documentUrl")} /></Field>
      </fieldset>
      <label className="flex items-start gap-3 text-sm text-mist">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#c9a45f]" checked={f.accept} onChange={set("accept")} required />
        <span>I confirm I’m authorized to offer these services and agree to the <Link href="/legal/provider-policy" className="text-gold-300 underline-offset-4 hover:underline">provider policy</Link>, including never requesting or sharing customer passwords.</span>
      </label>
      <FormError message={error} />
      <Button type="submit" size="lg" loading={loading}>Submit application</Button>
    </form>
  );
}
