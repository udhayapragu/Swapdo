import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getPaymentProvider } from "@/lib/payments";
import { formatMoney } from "@/lib/money";
import { CREDIT_VALUE_MINOR } from "@/lib/pricing";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { ServiceArt } from "@/components/ui/service-art";
import { durationLabel } from "@/config/durations";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requirePageUser({ next: `/checkout/${orderId}` });
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      promoCode: { select: { code: true, percentOff: true } },
      rental: { include: { service: { select: { name: true, slug: true, accent: true, icon: true, seller: { select: { displayName: true } } } }, plan: true } },
    },
  });
  if (!order || order.userId !== user.id) notFound();
  const provider = getPaymentProvider();
  const payment = order.payments[0];

  const successHref = order.purpose === "SUBSCRIPTION" ? "/dashboard/subscription?welcome=1" : `/dashboard/rentals/${order.rentalId}?welcome=1`;
  const service = order.rental?.service;

  return (
    <div className="container-page max-w-5xl pt-24 lg:pt-32">
      <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">Secure checkout</p>
      <h1 className="mt-3 text-3xl font-semibold text-ivory sm:text-4xl">Review & pay</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="glass rounded-3xl p-6" aria-label="Order summary">
          <div className="flex items-center gap-4">
            {service ? (
              <ServiceArt seed={service.slug} accent={service.accent} icon={service.icon} size="sm" className="h-16 w-16 shrink-0 rounded-2xl" />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-gold-400/30 bg-gold-400/10 text-gold-200">★</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ivory">{order.description}</p>
              <p className="text-sm text-fog">{service ? `by ${service.seller.displayName}` : "SWAPDO membership"} · Order {order.number}</p>
            </div>
          </div>
          {order.rental && (
            <div className="mt-5 rounded-2xl border hairline bg-black/20 p-4 text-sm text-mist">
              {order.purpose === "RENTAL_EXTEND"
                ? <>Adds <span className="text-ivory">{durationLabel(order.extendMinutes ?? 0)}</span> to your current rental. Time stacks on top of what’s remaining.</>
                : <>Access starts immediately after payment and lasts <span className="text-ivory">{durationLabel(order.rental.durationMinutes)}</span>{order.rental.usageLimit ? <> with <span className="text-ivory">{order.rental.usageLimit.toLocaleString("en-IN")} {order.rental.plan.usageUnit}</span> included</> : null}. It expires automatically.</>}
            </div>
          )}
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-mist"><dt>Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotalMinor, true)}</dd></div>
            {order.discountMinor > 0 && <div className="flex justify-between text-success"><dt>Discounts{order.promoCode ? ` (incl. ${order.promoCode.code})` : ""}</dt><dd className="tabular-nums">−{formatMoney(order.discountMinor, true)}</dd></div>}
            {order.creditsApplied > 0 && <div className="flex justify-between text-gold-200"><dt>{order.creditsApplied} credits</dt><dd className="tabular-nums">−{formatMoney(order.creditsApplied * CREDIT_VALUE_MINOR, true)}</dd></div>}
            <div className="flex justify-between border-t hairline pt-3 text-lg font-semibold text-ivory"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.totalMinor, true)}</dd></div>
          </dl>
          <p className="mt-6 flex items-start gap-2 text-xs text-fog"><ShieldCheck className="h-4 w-4 shrink-0 text-gold-400" /> Amounts were calculated on SWAPDO’s servers. Your access is only activated after the payment provider’s signed confirmation is verified.</p>
        </section>

        <section className="glass gold-border rounded-3xl p-6" aria-label="Payment">
          <h2 className="mb-5 text-sm font-semibold text-ivory">Payment</h2>
          <CheckoutClient
            orderId={order.id}
            status={order.status}
            provider={provider.name}
            totalLabel={formatMoney(order.totalMinor, true)}
            successHref={successHref}
            canCancelRentalId={order.purpose === "RENTAL_NEW" && order.rental?.status === "PENDING_PAYMENT" ? order.rentalId : null}
            razorpay={provider.name === "razorpay" && payment ? { key: process.env.RAZORPAY_KEY_ID ?? "", providerOrderId: payment.providerOrderId, amountMinor: payment.amountMinor, currency: order.currency, name: user.name, email: user.email } : undefined}
          />
        </section>
      </div>
    </div>
  );
}
