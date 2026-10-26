import Link from "next/link";
import { Logo, LogoMark } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
      <div className="grain relative hidden overflow-hidden border-r hairline bg-obsidian-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_20%,rgb(201_164_95/0.22),transparent),radial-gradient(60%_60%_at_80%_90%,rgb(106_79_209/0.28),transparent)]" aria-hidden />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" aria-hidden>
          <LogoMark className="h-[560px] w-[560px] animate-spin-slow" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" aria-label="SWAPDO home"><Logo /></Link>
          <div>
            <p className="font-display text-5xl leading-[1.05] text-ivory italic">“Access more.<br /><span className="text-gold">Commit less.”</span></p>
            <p className="mt-6 max-w-md text-mist">Premium AI tools, licensed entertainment and creator services — by the hour, week or month. Access ends automatically, so you only pay for what you use.</p>
          </div>
          <p className="text-xs text-smoke">Sandbox build · no real payments are processed.</p>
        </div>
      </div>
      <main id="main" className="relative flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgb(201_164_95/0.1),transparent)] lg:hidden" aria-hidden />
        <div className="relative w-full max-w-md">
          <Link href="/" className="mb-10 inline-block lg:hidden" aria-label="SWAPDO home"><Logo /></Link>
          {children}
        </div>
      </main>
    </div>
  );
}
