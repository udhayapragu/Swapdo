import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass rounded-2xl", className)} {...props} />;
}

export function PanelHeader({ title, description, action, className }: { title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ivory">{title}</h2>
        {description && <p className="mt-1 text-sm text-fog">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <Panel className={cn("p-5", className)}>
      <div className="flex items-center justify-between text-fog">
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        {icon && <span className="text-gold-400/80">{icon}</span>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-ivory tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-fog">{hint}</div>}
    </Panel>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-gold-300">{icon}</div>}
      <h3 className="text-base font-semibold text-ivory">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-fog">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
