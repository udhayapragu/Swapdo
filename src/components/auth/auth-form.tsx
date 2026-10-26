"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/form";
import { api, ClientApiError } from "@/lib/client";

type Mode = "login" | "register";

function safeNext(next: string | null) {
  // Only allow same-site relative paths to prevent open redirects.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function AuthForm({ mode, demoAccounts }: { mode: Mode; demoAccounts?: { label: string; email: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const next = safeNext(params.get("next"));

  async function submit(e: React.FormEvent, override?: { email: string; password: string }) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});
    try {
      const body = override ?? (mode === "login" ? { email: form.email, password: form.password } : form);
      const res = await api<{ role?: string }>(`/api/auth/${mode}`, { body });
      router.push(next ?? (res.role === "ADMIN" ? "/admin" : "/dashboard"));
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message);
      else setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <h1 className="text-3xl font-semibold text-ivory">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm text-fog">
        {mode === "login" ? "Sign in to manage your rentals and membership." : "Free forever. Upgrade only if you want member savings."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {mode === "register" && (
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} required minLength={2} />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint={mode === "register" ? "At least 10 characters, with a letter and a number." : undefined}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={set("password")} required className="pr-12" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-fog hover:text-ivory" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-fog">
        {mode === "login" ? "New to SWAPDO? " : "Already have an account? "}
        <Link href={`/${mode === "login" ? "register" : "login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-gold-300 hover:text-gold-200">
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
      {mode === "register" && <p className="mt-4 text-center text-xs text-smoke">By continuing you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.</p>}

      {demoAccounts && demoAccounts.length > 0 && (
        <div className="mt-10 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
          <p className="text-xs font-semibold tracking-wide text-violet-300 uppercase">Demo accounts</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {demoAccounts.map((a) => (
              <button key={a.email} type="button" disabled={loading} onClick={(e) => submit(e, { email: a.email, password: "SwapdoDemo2026" })} className="rounded-xl border border-white/10 px-2 py-2.5 text-xs font-medium text-ivory transition-colors hover:border-gold-400/40 hover:bg-white/[0.03]">
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-fog">One-click sign-in for exploring the build. Shown only when demo mode is enabled.</p>
        </div>
      )}
    </motion.div>
  );
}
