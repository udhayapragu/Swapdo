import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { PrintButton } from "@/components/dashboard/print-button";
import { formatMoney } from "@/lib/money";
import { CREDIT_VALUE_MINOR } from "@/lib/pricing";
import { formatDateTime } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await requirePageUser();
  const { orderId } = await params;
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: { where: { status: { in: ["CAPTURED", "REFUNDED"] } }, take: 1 }, user: true } });
  if (!order || order.userId !== user.id || !["PAID", "REFUNDED"].includes(order.status)) notFound();
  const payment = order.payments[0];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      <article className="glass rounded-3xl p-8 print:border-0 print:bg-white print:text-black print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <Logo />
          <div className="text-right text-sm">
            <p className="text-lg font-semibold text-ivory print:text-black">Invoice</p>
            <p className="font-mono text-fog">{order.number}</p>
            <p className="text-fog">{formatDateTime(order.paidAt ?? order.createdAt)}</p>
          </div>
        </header>
        {payment?.sandbox && <p className="mt-6 rounded-xl border border-violet-400/25 bg-violet-500/[0.06] px-4 py-2 text-xs text-violet-200">Sandbox transaction — no money was charged. Not a tax invoice.</p>}
        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><p className="text-xs tracking-wide text-fog uppercase">Billed to</p><p className="mt-1 text-ivory print:text-black">{order.user.name}</p><p className="text-fog">{order.user.email}</p></div>
          <div className="sm:text-right"><p className="text-xs tracking-wide text-fog uppercase">From</p><p className="mt-1 text-ivory print:text-black">{siteConfig.name}</p><p className="text-fog">{siteConfig.contact.address}</p></div>
        </div>
        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b hairline text-left text-xs text-fog uppercase"><th className="py-2 font-medium">Item</th><th className="py-2 text-right font-medium">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b hairline"><td className="py-3 text-ivory print:text-black">{order.description}</td><td className="py-3 text-right tabular-nums">{formatMoney(order.subtotalMinor, true)}</td></tr>
            {order.discountMinor > 0 && <tr><td className="py-2 text-fog">Discounts</td><td className="py-2 text-right text-success tabular-nums">−{formatMoney(order.discountMinor, true)}</td></tr>}
            {order.creditsApplied > 0 && <tr><td className="py-2 text-fog">Credits ({order.creditsApplied})</td><td className="py-2 text-right tabular-nums">−{formatMoney(order.creditsApplied * CREDIT_VALUE_MINOR, true)}</td></tr>}
            <tr><td className="pt-4 font-semibold text-ivory print:text-black">Total paid</td><td className="pt-4 text-right text-lg font-semibold text-ivory tabular-nums print:text-black">{formatMoney(order.totalMinor, true)}</td></tr>
          </tbody>
        </table>
        <footer className="mt-10 border-t hairline pt-4 text-xs text-fog">
          Payment via {payment?.provider ?? "—"} · Ref {payment?.providerPaymentId ?? "—"} · Status {order.status.toLowerCase()}
        </footer>
      </article>
    </div>
  );
}
