"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, LogOut, Menu, Search, Shield, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { cn, initials } from "@/lib/utils";

type HeaderUser = { name: string; email: string; role: string; isSeller: boolean } | null;

export function HeaderClient({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/seller", label: "Seller studio", icon: Store, show: user?.isSeller || user?.role === "SELLER" },
    { href: "/admin", label: "Admin", icon: Shield, show: user?.role === "ADMIN" },
  ].filter((l) => l.show);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300", scrolled || open ? "glass-strong border-x-0 border-t-0" : "border-b border-transparent")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-lg focus:bg-gold-400 focus:px-3 focus:py-2 focus:text-obsidian-950">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" aria-label="SWAPDO home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = item.href !== "/#how-it-works" && pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("relative rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors", active ? "text-ivory" : "text-mist hover:text-ivory")}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.06]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/marketplace?focus=search" aria-label="Search services" className="grid h-10 w-10 place-items-center rounded-full text-mist transition-colors hover:bg-white/5 hover:text-ivory">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          {user ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pr-3 pl-1 text-sm text-ivory transition-colors hover:border-gold-400/40">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-xs font-bold text-obsidian-950">{initials(user.name)}</span>
                <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="glass-strong absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl p-1.5 shadow-2xl">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-ivory">{user.name}</p>
                      <p className="truncate text-xs text-fog">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-white/5" />
                    {links.map((l) => (
                      <Link key={l.href} role="menuitem" href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-ivory">
                        <l.icon className="h-4 w-4" /> {l.label}
                      </Link>
                    ))}
                    <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-ivory">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
              <ButtonLink href="/register" size="sm">Get started</ButtonLink>
            </div>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-full text-ivory hover:bg-white/5 lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-nav" aria-label="Mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden lg:hidden">
            <div className="container-page space-y-1 pt-2 pb-6">
              {mainNav.map((item, i) => (
                <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link href={item.href} className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ivory hover:bg-white/5">{item.label}</Link>
                </motion.div>
              ))}
              <div className="my-3 h-px bg-white/5" />
              {user ? (
                <>
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-mist hover:bg-white/5">
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  ))}
                  <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-mist hover:bg-white/5">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <ButtonLink href="/login" variant="glass">Sign in</ButtonLink>
                  <ButtonLink href="/register">Get started</ButtonLink>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
