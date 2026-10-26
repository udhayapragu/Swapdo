import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-[100svh] place-items-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_40%,rgb(201_164_95/0.12),transparent)]" aria-hidden />
      <div className="relative">
        <LogoMark className="mx-auto h-14 w-14" />
        <p className="mt-8 font-display text-7xl text-gold italic">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ivory">This page has expired — or never existed.</h1>
        <p className="mt-2 text-fog">Unlike rentals, we can’t extend this one.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/marketplace" variant="glass">Marketplace</ButtonLink>
        </div>
        <Link href="/help" className="mt-6 inline-block text-sm text-fog hover:text-ivory">Help center</Link>
      </div>
    </main>
  );
}
