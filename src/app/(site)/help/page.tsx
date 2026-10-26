import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Hourglass, LifeBuoy, RotateCcw, ShieldCheck, Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Help center", description: "Answers about rentals, memberships, payments and refunds on SWAPDO." };

const TOPICS = [
  { icon: Hourglass, title: "Rentals & access", items: ["Access starts as soon as payment is verified and ends automatically.", "Extend from the rental page — extra time stacks on what’s left.", "Remaining time is measured on our servers, so device clocks don’t matter."] },
  { icon: CreditCard, title: "Payments", items: ["Prices are calculated on our servers and itemised on every invoice.", "Failed payment? Nothing is charged and held credits are returned — retry from checkout.", "This demo build uses a sandbox gateway: no real money moves."] },
  { icon: RotateCcw, title: "Refunds", items: ["Request a refund from Dashboard → Billing within the refund window.", "Automatic full refunds if a service fills up before your access starts."] },
  { icon: ShieldCheck, title: "Security", items: ["We never ask for third-party passwords.", "Sessions use secure, HTTP-only cookies.", "Report suspicious activity to support immediately."] },
  { icon: Store, title: "For providers", items: ["Apply from the Sell page with proof of authorization.", "Listings go live after moderation.", "Request payouts once you pass the minimum balance."] },
];

export default function HelpPage() {
  return (
    <div className="container-page max-w-5xl pt-28 lg:pt-36">
      <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">Help center</p>
      <h1 className="mt-3 text-4xl font-semibold text-ivory">How can we help?</h1>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {TOPICS.map((t) => (
          <section key={t.title} className="glass rounded-2xl p-6">
            <t.icon className="h-5 w-5 text-gold-300" />
            <h2 className="mt-3 font-semibold text-ivory">{t.title}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-mist marker:text-gold-400">
              {t.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </section>
        ))}
        <section className="glass gold-border flex flex-col justify-between rounded-2xl p-6">
          <div>
            <LifeBuoy className="h-5 w-5 text-gold-300" />
            <h2 className="mt-3 font-semibold text-ivory">Still need help?</h2>
            <p className="mt-2 text-sm text-mist">Open a ticket from your dashboard and we’ll reply by email. See also our <Link href="/legal/refunds" className="text-gold-300">refund policy</Link>.</p>
          </div>
          <ButtonLink href="/dashboard/support" className="mt-6 w-fit" size="sm">Contact support</ButtonLink>
        </section>
      </div>
    </div>
  );
}
