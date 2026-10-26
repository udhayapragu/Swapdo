import { CreditCard, Hourglass, Play, Search, Timer } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/reveal";

const STEPS = [
  { icon: Search, title: "Discover a service", body: "Browse verified AI tools, licensed channels and creator services." },
  { icon: Timer, title: "Choose your duration", body: "From one hour to a full year — pay only for the window you need." },
  { icon: CreditCard, title: "Pay securely", body: "Server-verified checkout. Prices are always calculated on our side." },
  { icon: Play, title: "Start using it", body: "Access is provisioned through the provider’s official integration." },
  { icon: Hourglass, title: "Expires automatically", body: "No lingering subscriptions. Renew in a tap if you need more time." },
];

export function HowItWorks() {
  return (
    <Stagger className="relative mt-16 grid gap-4 md:grid-cols-5">
      <div className="pointer-events-none absolute top-8 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent md:block" aria-hidden />
      {STEPS.map((s, i) => (
        <StaggerItem key={s.title} className="relative">
          <div className="flex gap-4 md:flex-col md:items-center md:text-center">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-gold-400/20 bg-obsidian-900 shadow-[0_0_40px_-12px_rgb(201_164_95/0.5)]">
              <s.icon className="h-6 w-6 text-gold-300" strokeWidth={1.6} />
              <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-[11px] font-bold text-obsidian-950">{i + 1}</span>
            </div>
            <div className="md:mt-5">
              <h3 className="text-[15px] font-semibold text-ivory">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fog">{s.body}</p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
