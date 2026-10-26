// Rental durations offered on the platform. Sellers choose a subset per service.
export const RENTAL_DURATIONS = [
  { minutes: 60, label: "1 hour", short: "1h" },
  { minutes: 180, label: "3 hours", short: "3h" },
  { minutes: 360, label: "6 hours", short: "6h" },
  { minutes: 1440, label: "24 hours", short: "24h" },
  { minutes: 10080, label: "1 week", short: "Week" },
  { minutes: 43200, label: "1 month", short: "Month" },
  { minutes: 525600, label: "1 year", short: "Year" },
] as const;

export const ALLOWED_DURATION_MINUTES: readonly number[] = RENTAL_DURATIONS.map((d) => d.minutes);

export function durationLabel(minutes: number): string {
  const known = RENTAL_DURATIONS.find((d) => d.minutes === minutes);
  if (known) return known.label;
  if (minutes % 1440 === 0) return `${minutes / 1440} days`;
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

export function durationShort(minutes: number): string {
  return RENTAL_DURATIONS.find((d) => d.minutes === minutes)?.short ?? durationLabel(minutes);
}

/** Duration filter buckets used by the marketplace. */
export const DURATION_FILTERS = [
  { value: "hourly", label: "Hourly", match: (m: number) => m < 1440 },
  { value: "daily", label: "Daily", match: (m: number) => m === 1440 },
  { value: "weekly", label: "Weekly", match: (m: number) => m === 10080 },
  { value: "monthly", label: "Monthly", match: (m: number) => m === 43200 },
  { value: "annual", label: "Annual", match: (m: number) => m === 525600 },
] as const;
