"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, Clock, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { ServiceIcon } from "@/components/ui/icon";
import { formatRemaining } from "@/components/ui/countdown";
import { HeroCanvas } from "./hero-canvas";

const EASE = [0.22, 1, 0.36, 1] as const;
const SUGGESTIONS = ["AI video generation for 3 hours", "a coding copilot for the weekend", "live cricket tonight", "voice-overs in Tamil", "a YouTube channel manager"];

export type HeroCard = { name: string; provider: string; price: string; icon: string; accent: string; minutesLeft: number };

function FloatingCard({ card, className, y, delay }: { card: HeroCard; className: string; y: MotionValue<number>; delay: number }) {
  const [left, setLeft] = useState(card.minutesLeft * 60_000);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setLeft(card.minutesLeft * 60_000 - (Date.now() - start)), 1000);
    return () => clearInterval(id);
  }, [card.minutesLeft]);
  return (
    <motion.div style={{ y }} className={`absolute hidden min-[1380px]:block ${className}`} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay, ease: EASE }}>
      <div className="glass gold-border w-56 animate-float rounded-2xl p-4" style={{ animationDelay: `${delay * 2}s`, background: "linear-gradient(160deg, rgb(255 255 255 / 0.07), rgb(255 255 255 / 0.015))" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10" style={{ background: `${card.accent}22`, boxShadow: `0 0 24px -6px ${card.accent}` }}>
            <ServiceIcon name={card.icon} className="h-5 w-5 text-ivory" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ivory">{card.name}</p>
            <p className="truncate text-xs text-fog">{card.provider}</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.16em] text-fog uppercase">Access left</p>
            <p className="font-mono text-base text-gold-200 tabular-nums" suppressHydrationWarning>{formatRemaining(left)}</p>
          </div>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">● Live</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-violet-400" style={{ width: `${Math.max(8, Math.min(100, (left / (card.minutesLeft * 60_000 * 1.6)) * 100))}%` }} />
        </div>
        <p className="mt-3 text-xs text-mist">from <span className="font-semibold text-ivory">{card.price}</span></p>
      </div>
    </motion.div>
  );
}

function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (value) return;
    const target = SUGGESTIONS[idx]!;
    if (reduce) {
      setTyped(target);
      const t = setTimeout(() => setIdx((i) => (i + 1) % SUGGESTIONS.length), 3000);
      return () => clearTimeout(t);
    }
    if (typed.length < target.length) {
      const t = setTimeout(() => setTyped(target.slice(0, typed.length + 1)), 45);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped("");
      setIdx((i) => (i + 1) % SUGGESTIONS.length);
    }, 2200);
    return () => clearTimeout(t);
  }, [typed, idx, value, reduce]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/marketplace${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);
      }}
      className="group relative mx-auto mt-10 w-full max-w-xl"
    >
      <div className="absolute -inset-px rounded-full bg-gradient-to-r from-gold-400/40 via-violet-500/30 to-gold-400/40 opacity-60 blur-[1px] transition-opacity duration-500 group-focus-within:opacity-100" aria-hidden />
      <div className="relative flex items-center gap-2 rounded-full border border-white/10 bg-obsidian-900/90 p-1.5 pl-5">
        <Search className="h-[18px] w-[18px] shrink-0 text-gold-300" aria-hidden />
        <label htmlFor="hero-search" className="sr-only">Search services</label>
        <input
          id="hero-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Find ${typed}`}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ivory placeholder:text-fog focus:outline-none"
          autoComplete="off"
        />
        <button type="submit" className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-5 text-sm font-semibold text-obsidian-950 transition-transform active:scale-95">
          Search <ArrowRight className="hidden h-4 w-4 sm:block" />
        </button>
      </div>
    </form>
  );
}

export function Hero({ cards, serviceCount }: { cards: HeroCard[]; serviceCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  const words = ["Everything", "You", "Need."];
  return (
    <section ref={ref} className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-20">
      {/* Cinematic lighting */}
      <motion.div style={{ y: glowY }} className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-[-20%] left-1/2 h-[70vh] w-[90vw] max-w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(201_164_95/0.22),transparent)]" />
        <div className="absolute top-[25%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,rgb(106_79_209/0.22),transparent)]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[45vw] rounded-full bg-[radial-gradient(closest-side,rgb(106_79_209/0.16),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian-950 to-transparent" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" aria-hidden />
      <HeroCanvas />

      {/* Side gutters only (≥1380px) so cards never overlap the headline. */}
      {cards[0] && <FloatingCard card={cards[0]} className="top-[24%] left-[2.5%] 2xl:left-[6%]" y={y1} delay={0.5} />}
      {cards[1] && <FloatingCard card={cards[1]} className="top-[20%] right-[2.5%] 2xl:right-[6%]" y={y2} delay={0.7} />}
      {cards[2] && <FloatingCard card={cards[2]} className="bottom-[13%] left-[4%] 2xl:left-[9%]" y={y3} delay={0.9} />}
      {cards[3] && <FloatingCard card={cards[3]} className="right-[4%] bottom-[15%] 2xl:right-[9%]" y={y1} delay={1.1} />}

      <motion.div style={{ opacity: fade }} className="container-page relative text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="mx-auto mb-8 flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pr-4 pl-1.5 text-xs text-mist">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-obsidian-800">
            <LogoMark animated className="h-5 w-5" />
          </span>
          {serviceCount > 0 ? <span><span className="font-semibold text-gold-200">{serviceCount}+</span> authorized services · rent by the hour</span> : <span>Authorized services · rent by the hour</span>}
        </motion.div>

        <h1 className="mx-auto max-w-5xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-ivory sm:text-6xl lg:text-[5.4rem]">
          <span className="block">
            {words.map((w, i) => (
              <motion.span key={w} className="mr-[0.22em] inline-block last:mr-0" initial={{ opacity: 0, y: reduce ? 0 : 28, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.1 + i * 0.09, ease: EASE }}>
                {w}
              </motion.span>
            ))}
          </span>
          <motion.span className="mt-1 block font-display font-normal italic tracking-[-0.01em]" initial={{ opacity: 0, y: reduce ? 0 : 28, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, delay: 0.42, ease: EASE }}>
            <span className="text-gold">Only When You Need It.</span>
          </motion.span>
        </h1>

        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6, ease: EASE }} className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-mist sm:text-lg">
          Discover premium AI tools, digital experiences, and creator services. <span className="text-ivory">Access more. Commit less.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.72, ease: EASE }}>
          <HeroSearch />
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/marketplace" size="lg" className="w-full sm:w-auto">
              Explore Marketplace <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/memberships" size="lg" variant="glass" className="w-full sm:w-auto">
              Explore Memberships
            </ButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fog">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold-400" /> Authorized providers only</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gold-400" /> Access ends automatically</span>
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> No passwords shared, ever</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
