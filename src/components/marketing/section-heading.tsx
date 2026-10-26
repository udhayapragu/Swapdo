import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, accent, body, align = "center", className }: { eyebrow: string; title: string; accent?: string; body?: string; align?: "center" | "left"; className?: string }) {
  return (
    <Reveal className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-2xl", className)}>
      <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-3xl leading-[1.08] font-semibold text-ivory sm:text-[2.75rem]">
        {title} {accent && <span className="font-display font-normal italic text-gold">{accent}</span>}
      </h2>
      {body && <p className="mt-4 text-base leading-relaxed text-mist">{body}</p>}
    </Reveal>
  );
}
