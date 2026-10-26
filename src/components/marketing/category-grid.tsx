import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/ui/icon";

type Cat = { slug: string; name: string; tagline: string; icon: string; accent: string; _count: { services: number } };

export function CategoryGrid({ categories }: { categories: Cat[] }) {
  return (
    <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c, i) => (
        <StaggerItem key={c.slug} className={i === 0 || i === categories.length - 1 ? "sm:col-span-2 lg:col-span-1" : undefined}>
          <Link
            href={`/marketplace?category=${c.slug}`}
            className="group relative flex h-full min-h-48 flex-col overflow-hidden rounded-3xl glass p-6 transition-[transform,border-color] duration-500 hover:-translate-y-1 sm:p-7"
          >
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-25 blur-2xl transition-opacity duration-700 group-hover:opacity-50" style={{ background: `radial-gradient(closest-side, ${c.accent}, transparent)` }} aria-hidden />
            <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 0 1px ${c.accent}66` }} aria-hidden />
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]" style={{ background: `${c.accent}1f`, boxShadow: `0 0 30px -10px ${c.accent}` }}>
                <ServiceIcon name={c.icon} className="h-6 w-6" />
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-fog transition-all duration-300 group-hover:border-white/25 group-hover:text-ivory">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
            <div className="mt-auto pt-10">
              <p className="text-xs font-medium tracking-wide" style={{ color: c.accent }}>{c._count.services} services</p>
              <h3 className="mt-1 text-xl font-semibold text-ivory">{c.name}</h3>
              <p className="mt-1.5 text-sm text-fog">{c.tagline}</p>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
