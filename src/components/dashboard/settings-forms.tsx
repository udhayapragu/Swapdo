"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

export function ProfileForm({ name: initial }: { name: string }) {
  const [name, setName] = useState(initial);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={async (e) => { e.preventDefault(); setLoading(true); try { await api("/api/account", { method: "PATCH", body: { name } }); toast({ tone: "success", message: "Profile updated" }); router.refresh(); } catch (err) { toast({ tone: "error", message: (err as Error).message }); } setLoading(false); }}>
      <Field label="Display name" htmlFor="s-name" className="flex-1"><Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></Field>
      <Button type="submit" loading={loading} disabled={name === initial}>Save</Button>
    </form>
  );
}

export function PasswordForm() {
  const [f, setF] = useState({ current: "", next: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  return (
    <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); setLoading(true); setError(null); try { await api("/api/account/password", { body: f }); setF({ current: "", next: "" }); toast({ tone: "success", message: "Password changed" }); } catch (err) { setError((err as Error).message); } setLoading(false); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Current password" htmlFor="pw-cur"><Input id="pw-cur" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></Field>
        <Field label="New password" htmlFor="pw-new" hint="10+ characters, a letter and a number"><Input id="pw-new" type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required /></Field>
      </div>
      <FormError message={error} />
      <Button type="submit" variant="glass" loading={loading}>Change password</Button>
    </form>
  );
}

export function SignOutEverywhere() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return <Button variant="danger" size="sm" loading={loading} onClick={async () => { setLoading(true); await api("/api/account/sessions", { method: "DELETE" }).catch(() => {}); router.push("/login"); router.refresh(); }}>Sign out of all devices</Button>;
}

export function TicketForm() {
  const [f, setF] = useState({ subject: "", body: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setLoading(true); setError(null); try { await api("/api/support", { body: f }); setF({ subject: "", body: "" }); toast({ tone: "success", message: "Ticket opened — we’ll reply by email." }); router.refresh(); } catch (err) { setError((err as Error).message); } setLoading(false); }}>
      <Field label="Subject" htmlFor="t-subject"><Input id="t-subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} required minLength={4} maxLength={120} /></Field>
      <Field label="How can we help?" htmlFor="t-body"><Textarea id="t-body" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required minLength={10} maxLength={2000} /></Field>
      <FormError message={error} />
      <Button type="submit" loading={loading}>Open ticket</Button>
    </form>
  );
}
