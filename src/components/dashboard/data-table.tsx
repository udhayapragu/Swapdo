import { cn } from "@/lib/utils";

/** Responsive table: horizontal scroll on small screens, never page overflow. */
export function DataTable({ head, children, className, empty }: { head: string[]; children: React.ReactNode; className?: string; empty?: React.ReactNode }) {
  return (
    <div className={cn("glass overflow-hidden rounded-2xl", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b hairline text-left text-[11px] tracking-wide text-fog uppercase">
              {head.map((h, i) => <th key={i} scope="col" className="px-5 py-3.5 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] [&_td]:px-5 [&_td]:py-3.5 [&_td]:align-middle [&_tr]:transition-colors [&_tr:hover]:bg-white/[0.015]">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}
