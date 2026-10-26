"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { DURATION_FILTERS } from "@/config/durations";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    next.delete("focus");
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    start(() => router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false }));
  }
  const reset = () => start(() => router.replace(pathname, { scroll: false }));
  return { params, update, reset, pending };
}

/** Duration, price and verification filters (desktop sidebar + mobile sheet). */
export function AdvancedFilters() {
  const { params, update } = useFilterParams();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <Field label="Rental duration" htmlFor="f-duration">
        <Select id="f-duration" value={params.get("duration") ?? ""} onChange={(e) => update({ duration: e.target.value })}>
          <option value="">Any duration</option>
          {DURATION_FILTERS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min price (₹)" htmlFor="f-min">
          <Input id="f-min" type="number" inputMode="numeric" min={0} placeholder="0" defaultValue={params.get("min") ?? ""} onBlur={(e) => update({ min: e.target.value })} />
        </Field>
        <Field label="Max price (₹)" htmlFor="f-max">
          <Input id="f-max" type="number" inputMode="numeric" min={0} placeholder="Any" defaultValue={params.get("max") ?? ""} onBlur={(e) => update({ max: e.target.value })} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-obsidian-850/80 px-4 py-3 text-sm text-mist">
        Verified providers only
        <input type="checkbox" className="h-4 w-4 accent-[#c9a45f]" checked={params.get("verified") === "1"} onChange={(e) => update({ verified: e.target.checked ? "1" : null })} />
      </label>
    </div>
  );
}

export function MarketplaceFilters({ categories, total }: { categories: Cat[]; total: number }) {
  const { params, update, reset, pending } = useFilterParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sheet, setSheet] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focus") === "search") inputRef.current?.focus();
  }, [params]);

  // Debounced search
  useEffect(() => {
    if ((params.get("q") ?? "") === q) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = params.get("category");
  const activeFilters = ["duration", "min", "max", "verified"].filter((k) => params.get(k)).length;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-b hairline bg-obsidian-950/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gold-300" aria-hidden />
            <label htmlFor="market-search" className="sr-only">Search services</label>
            <input
              ref={inputRef}
              id="market-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search AI tools, channels, creator services…"
              className="h-12 w-full rounded-full border border-white/10 bg-obsidian-850/80 pr-10 pl-11 text-[15px] text-ivory placeholder:text-smoke focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-fog hover:text-ivory" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="hidden sm:block">
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <Select id="sort" value={params.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })} className="h-12 w-52 rounded-full">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <button onClick={() => setSheet(true)} className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-obsidian-850/80 text-ivory lg:hidden" aria-label="Open filters">
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-[10px] font-bold text-obsidian-950">{activeFilters}</span>}
          </button>
        </div>
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Categories">
          {[{ slug: "", name: "All" }, ...categories].map((c) => {
            const selected = (active ?? "") === c.slug;
            return (
              <button key={c.slug || "all"} role="tab" aria-selected={selected} onClick={() => update({ category: c.slug || null })} className={cn("relative shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors", selected ? "text-obsidian-950" : "border border-white/10 text-mist hover:text-ivory")}>
                {selected && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-gradient-to-b from-gold-300 to-gold-500" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-fog">
        <p aria-live="polite">
          {pending ? "Updating…" : `${total} service${total === 1 ? "" : "s"}`}
          {params.get("q") && <> for “<span className="text-ivory">{params.get("q")}</span>”</>}
        </p>
        {(activeFilters > 0 || active || params.get("q")) && (
          <button onClick={() => { setQ(""); reset(); }} className="text-gold-300 hover:text-gold-200">Clear all</button>
        )}
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filters">
        <div className="space-y-4">
          <Field label="Sort by" htmlFor="sort-m">
            <Select id="sort-m" value={params.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <AdvancedFilters />
          <Button className="w-full" onClick={() => setSheet(false)}>Show {total} results</Button>
        </div>
      </Dialog>

      <MarketplacePendingOverlay pending={pending} />
    </>
  );
}

function MarketplacePendingOverlay({ pending }: { pending: boolean }) {
  return <div className={cn("pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-gold-300 to-violet-400 transition-transform duration-500", pending ? "scale-x-75" : "scale-x-0")} aria-hidden />;
}
