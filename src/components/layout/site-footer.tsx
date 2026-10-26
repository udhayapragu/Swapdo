import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { footerNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t hairline bg-obsidian-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-fog">
            The premium marketplace for time-based access to authorized AI tools, licensed entertainment and creator services.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-mist">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold-400" /> <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-ivory">{siteConfig.contact.email}</a></li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold-400" /> {siteConfig.contact.address}</li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerNav.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold tracking-[0.18em] text-gold-300/90 uppercase">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-fog transition-colors hover:text-ivory">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t hairline">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-smoke sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SWAPDO. All rights reserved.</p>
          {(process.env.PAYMENT_PROVIDER ?? "mock") === "mock" && <p>Payments run in sandbox mode.</p>}
        </div>
      </div>
    </footer>
  );
}
