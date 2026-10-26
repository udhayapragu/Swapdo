"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Activity, Bell, BookOpen, ChartLine, CreditCard, Crown, Flag, Heart, History, Inbox, LayoutDashboard, LifeBuoy, ListChecks, LogOut, Menu,
  Package, Percent, ScrollText, Settings, Shield, ShoppingBag, SlidersHorizontal, Store, Tag, Timer, Users, Wallet, X, Layers, ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn, initials } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity, bell: Bell, book: BookOpen, chart: ChartLine, card: CreditCard, crown: Crown, flag: Flag, heart: Heart, history: History,
  inbox: Inbox, dashboard: LayoutDashboard, support: LifeBuoy, checks: ListChecks, package: Package, percent: Percent, scroll: ScrollText,
  settings: Settings, shield: Shield, bag: ShoppingBag, sliders: SlidersHorizontal, store: Store, tag: Tag, timer: Timer, users: Users, wallet: Wallet, layers: Layers,
};

export type NavItem = { href: string; label: string; icon: string; badge?: number; exact?: boolean };
export type NavGroup = { title?: string; items: NavItem[] };

export function DashboardShell({ area, groups, user, children }: { area: string; groups: NavGroup[]; user: { name: string; email: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav aria-label={`${area} navigation`} className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.title && <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-smoke uppercase">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors", active ? "text-ivory" : "text-fog hover:bg-white/[0.03] hover:text-ivory")}>
                    {active && <motion.span layoutId={`dash-active-${area}`} className="absolute inset-0 rounded-xl border border-gold-400/20 bg-gradient-to-r from-gold-400/[0.10] to-transparent" transition={{ type: "spring", stiffness: 400, damping: 36 }} />}
                    <Icon className={cn("relative h-4 w-4", active && "text-gold-300")} strokeWidth={1.7} />
                    <span className="relative flex-1">{item.label}</span>
                    {!!item.badge && <span className="relative rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-obsidian-950">{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t hairline p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-xs font-bold text-obsidian-950">{initials(user.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ivory">{user.name}</p>
          <p className="truncate text-xs text-fog">{user.email}</p>
        </div>
        <button onClick={signOut} className="grid h-8 w-8 place-items-center rounded-lg text-fog hover:bg-white/5 hover:text-ivory" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
      </div>
      <Link href="/" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-fog hover:text-ivory"><ArrowLeft className="h-3.5 w-3.5" /> Back to SWAPDO</Link>
    </div>
  );

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-[100svh] flex-col border-r hairline bg-obsidian-950 lg:flex">
        <div className="flex h-[72px] items-center justify-between px-5">
          <Link href="/" aria-label="SWAPDO home"><Logo /></Link>
        </div>
        <p className="mx-5 -mt-2 mb-1 text-[11px] font-semibold tracking-[0.16em] text-gold-300/80 uppercase">{area}</p>
        {nav}
        {footer}
      </aside>

      <div className="glass-strong sticky top-0 z-40 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 lg:hidden">
        <Link href="/" aria-label="SWAPDO home"><Logo /></Link>
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-ivory hover:bg-white/5" aria-label="Open navigation" aria-expanded={open}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r hairline bg-obsidian-950">
              <div className="flex h-16 items-center justify-between px-4">
                <span className="text-[11px] font-semibold tracking-[0.16em] text-gold-300/80 uppercase">{area}</span>
                <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-ivory hover:bg-white/5" aria-label="Close navigation"><X className="h-5 w-5" /></button>
              </div>
              {nav}
              {footer}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main id="main" className="relative min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(50%_80%_at_70%_0%,rgb(201_164_95/0.07),transparent)]" aria-hidden />
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-gold-300/90 uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-fog">{description}</p>}
      </div>
      {action}
    </div>
  );
}
