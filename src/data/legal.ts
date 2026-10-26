// Template policy copy for the demo build. Have qualified counsel review
// before launch — these are starting points, not legal advice.
export type LegalDoc = { title: string; summary: string; sections: { heading: string; body: string }[] };

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of Service",
    summary: "The rules for using SWAPDO to discover and rent access to digital services.",
    sections: [
      { heading: "What SWAPDO is", body: "SWAPDO is a marketplace connecting customers with independent providers who are authorized to offer time-limited access to digital services. Providers deliver the services; SWAPDO operates the platform, checkout and access-window enforcement." },
      { heading: "Accounts", body: "You must provide accurate information and keep your password confidential. You’re responsible for activity on your account. We may suspend accounts that breach these terms or our Acceptable Use Policy." },
      { heading: "Rentals", body: "A rental grants access for the purchased duration starting when payment is confirmed. Access ends automatically when the period ends or included usage is consumed. Times are measured by SWAPDO’s servers." },
      { heading: "Memberships", body: "Paid memberships renew automatically until cancelled. Cancellation takes effect at the end of the current period. Credits have no cash value, cannot be transferred and may be used for up to 50% of a rental." },
      { heading: "Prohibited use", body: "You may not resell, share or attempt to extend access beyond what you purchased, interfere with the platform, or use services unlawfully." },
      { heading: "Liability", body: "Services are provided by independent providers. To the extent permitted by law, SWAPDO’s liability is limited to the amount you paid for the affected order." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary: "What we collect, why, and the choices you have.",
    sections: [
      { heading: "Data we collect", body: "Account details (name, email), order and rental history, usage records needed to enforce limits, and technical data such as IP address for security. Payment card details are handled by our payment provider and never stored by SWAPDO." },
      { heading: "How we use it", body: "To provide and secure the service, process payments, enforce rental windows, prevent fraud, provide support and — with consent — send product updates." },
      { heading: "Sharing", body: "We share the minimum necessary with the provider of a service you rent and with our payment processor. We never sell personal data and never request or store third-party passwords." },
      { heading: "Retention & rights", body: "We keep data while your account is active and as required by law (e.g. tax records). You may request access, correction or deletion by contacting support." },
    ],
  },
  refunds: {
    title: "Refund Policy",
    summary: "When and how you can get your money back.",
    sections: [
      { heading: "Eligible situations", body: "If a service is unavailable for a material part of your rental, doesn’t match its listing, or a duplicate charge occurs, request a refund from Dashboard → Billing within the refund window shown there." },
      { heading: "Automatic refunds", body: "If a service reaches capacity after you pay but before access starts, the order is refunded automatically in full, including any credits used." },
      { heading: "Review", body: "Requests are reviewed within one business day. Approved refunds return to the original payment method; credits used are returned to your balance." },
      { heading: "Memberships", body: "Membership fees are non-refundable once a period begins, except where required by law. You keep benefits until the end of the paid period after cancelling." },
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    summary: "Keeping SWAPDO safe for customers and providers.",
    sections: [
      { heading: "Don’t share or resell access", body: "Rentals are for the purchasing account only. Sharing grants, scraping access tokens or reselling time is prohibited." },
      { heading: "Don’t abuse services", body: "Follow each provider’s content and usage rules. Don’t use rented services to create unlawful, infringing or harmful content." },
      { heading: "Don’t circumvent controls", body: "Attempts to bypass rental expiry, usage limits, payment verification or rate limits will result in suspension." },
    ],
  },
  "provider-policy": {
    title: "Provider Policy",
    summary: "Requirements for offering services on SWAPDO.",
    sections: [
      { heading: "Authorization is mandatory", body: "You may only list services you own, or are authorized to offer via an official API programme, reseller agreement or content licence. Each listing must reference an approved authorization." },
      { heading: "No credential sharing", body: "Never ask customers for — or give customers — account passwords. Deliver access via official APIs, OAuth, provider-issued tokens or delegated roles only." },
      { heading: "Accurate listings", body: "Describe services, durations and usage limits accurately. Don’t advertise unlimited usage you can’t sustain." },
      { heading: "Commission & payouts", body: "SWAPDO deducts the platform commission shown in your studio from each order. Earnings from refunded orders are reversed. Payouts can be requested once you reach the minimum balance." },
      { heading: "Moderation", body: "Listings are reviewed before going live. We may suspend listings or accounts for policy breaches, fraud or repeated customer complaints." },
    ],
  },
};
