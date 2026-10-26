import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants = {
  gold: "bg-gradient-to-b from-gold-300 to-gold-500 text-obsidian-950 shadow-[0_1px_0_0_rgb(255_255_255/0.5)_inset,0_10px_30px_-10px_rgb(201_164_95/0.7)] hover:from-gold-200 hover:to-gold-400 hover:shadow-[0_1px_0_0_rgb(255_255_255/0.6)_inset,0_14px_40px_-10px_rgb(201_164_95/0.85)]",
  glass: "glass text-ivory hover:bg-white/[0.07] hover:border-white/15",
  outline: "border border-gold-400/40 text-gold-200 hover:border-gold-300/80 hover:bg-gold-400/[0.06]",
  ghost: "text-mist hover:text-ivory hover:bg-white/[0.05]",
  violet: "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_10px_30px_-12px_rgb(138_108_240/0.8)]",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
} as const;

const sizes = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
  icon: "h-10 w-10",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClass(variant: ButtonVariant = "gold", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "gold", size = "md", loading, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant = "gold", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
