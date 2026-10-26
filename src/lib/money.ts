const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrPrecise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

/** Format integer paise as rupees. */
export function formatMoney(minor: number, precise = false): string {
  const rupees = minor / 100;
  if (!precise && Number.isInteger(rupees)) return inr.format(rupees);
  return inrPrecise.format(rupees);
}

export function applyBps(amountMinor: number, bps: number): number {
  return Math.round((amountMinor * bps) / 10000);
}
