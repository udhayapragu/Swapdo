export const siteConfig = {
  name: "SWAPDO",
  tagline: "Everything You Need. Only When You Need It.",
  description:
    "Discover premium AI tools, digital experiences, and creator services. Rent authorized access by the hour, week, or month. Access more. Commit less.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  currency: "INR",
  locale: "en-IN",
  contact: {
    email: "hello@swapdo.example",
    support: "support@swapdo.example",
    address: "Bengaluru, India",
  },
  // Rentals with less than this much time left are shown as "Expiring soon".
  expiringSoonMinutes: 15,
  expiringSoonRatio: 0.1,
  // Members may pay up to this share of an order with credits (1 credit = ₹1).
  maxCreditShare: 0.5,
  sessionDays: 30,
} as const;

export const mainNav = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/memberships", label: "Memberships" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/sell", label: "Sell on SWAPDO" },
] as const;

export const footerNav = [
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "All services" },
      { href: "/marketplace?category=ai-studio", label: "AI Studio" },
      { href: "/marketplace?category=video-creative", label: "Video & Creative" },
      { href: "/marketplace?category=entertainment", label: "Entertainment" },
      { href: "/memberships", label: "Memberships" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { href: "/sell", label: "Become a provider" },
      { href: "/seller", label: "Seller dashboard" },
      { href: "/legal/provider-policy", label: "Provider policy" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/legal/refunds", label: "Refund policy" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of service" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/acceptable-use", label: "Acceptable use" },
    ],
  },
] as const;
