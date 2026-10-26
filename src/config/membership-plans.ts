// Default membership catalogue. This seeds the SubscriptionPlan table;
// at runtime the UI reads plans from the database (editable in Admin → Pricing).
// Prices in paise. No plan advertises unlimited usage.
export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    code: "FREE",
    name: "Free",
    tagline: "Explore the marketplace and rent as you go.",
    monthlyPriceMinor: 0,
    annualPriceMinor: 0,
    monthlyCredits: 0,
    maxConcurrentRentals: 1,
    rentalDiscountBps: 0,
    gracePeriodDays: 0,
    highlighted: false,
    sortOrder: 0,
    features: [
      "Pay-per-rental access",
      "1 active rental at a time",
      "Favorites & wishlists",
      "Standard support",
    ],
  },
  {
    code: "STARTER",
    name: "Starter",
    tagline: "For curious creators trying new tools every week.",
    monthlyPriceMinor: 49900,
    annualPriceMinor: 479000,
    monthlyCredits: 300,
    maxConcurrentRentals: 3,
    rentalDiscountBps: 500,
    gracePeriodDays: 3,
    highlighted: false,
    sortOrder: 1,
    features: [
      "300 credits every month",
      "5% off every rental",
      "Up to 3 active rentals",
      "Rental renewal reminders",
    ],
  },
  {
    code: "PRO",
    name: "Pro",
    tagline: "For professionals who live inside AI tools.",
    monthlyPriceMinor: 149900,
    annualPriceMinor: 1439000,
    monthlyCredits: 1200,
    maxConcurrentRentals: 8,
    rentalDiscountBps: 1200,
    gracePeriodDays: 5,
    highlighted: true,
    sortOrder: 2,
    features: [
      "1,200 credits every month",
      "12% off every rental",
      "Up to 8 active rentals",
      "Priority support",
      "Early access to new services",
    ],
  },
  {
    code: "ELITE",
    name: "Elite",
    tagline: "For studios and teams running at full capacity.",
    monthlyPriceMinor: 399900,
    annualPriceMinor: 3839000,
    monthlyCredits: 4000,
    maxConcurrentRentals: 20,
    rentalDiscountBps: 2000,
    gracePeriodDays: 7,
    highlighted: false,
    sortOrder: 3,
    features: [
      "4,000 credits every month",
      "20% off every rental",
      "Up to 20 active rentals",
      "Dedicated concierge",
      "Quarterly usage review",
    ],
  },
] as const;

export const DEFAULT_PLATFORM_SETTINGS = {
  commissionRateBps: 1500,
  minimumPayoutMinor: 100000,
  refundWindowHours: 24,
} as const;

export const DEFAULT_FEATURE_FLAGS = [
  { key: "seller_signups", enabled: true, description: "Allow new provider applications" },
  { key: "credits_at_checkout", enabled: true, description: "Let members pay part of an order with credits" },
  { key: "promo_codes", enabled: true, description: "Accept promotional codes at checkout" },
  { key: "fraud_auto_flag", enabled: true, description: "Automatically flag suspicious order patterns" },
  { key: "maintenance_banner", enabled: false, description: "Show a maintenance banner across the site" },
] as const;
