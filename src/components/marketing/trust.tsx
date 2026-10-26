import { BadgeCheck, Gauge, Lock, ReceiptText, RotateCcw, ShieldCheck } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

const ITEMS = [
  { icon: Lock, title: "Secure checkout", body: "Payments are verified server-side with signed webhooks. We never see or store card numbers." },
  { icon: BadgeCheck, title: "Verified providers", body: "Every seller proves they’re authorized to offer access — official APIs, licences or first-party ownership." },
  { icon: ReceiptText, title: "Transparent pricing", body: "The price you see is the price you pay, with member discounts and credits itemised on every invoice." },
  { icon: Gauge, title: "Usage controls", body: "Clear usage limits per rental, live remaining-time counters and automatic expiry." },
  { icon: RotateCcw, title: "Clear refunds", body: "If a service fails to deliver, request a refund from your dashboard. Reviewed within one business day." },
  { icon: ShieldCheck, title: "No shared passwords", body: "We never ask for, or pass around, third-party account credentials. Access is always delegated." },
];

export function TrustGrid() {
  return (
    <Stagger className="mt-14 grid gap-px overflow-hidden rounded-3xl border hairline bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
      {ITEMS.map((it) => (
        <StaggerItem key={it.title} className="bg-obsidian-950 p-7 transition-colors duration-500 hover:bg-obsidian-900">
          <it.icon className="h-6 w-6 text-gold-300" strokeWidth={1.5} />
          <h3 className="mt-5 text-[15px] font-semibold text-ivory">{it.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-fog">{it.body}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
