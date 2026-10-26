import { z } from "zod";
import { ALLOWED_DURATION_MINUTES } from "@/config/durations";

const id = z.string().min(1).max(64);
const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const registerSchema = z.object({
  name: text(2, 80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const rentalCheckoutSchema = z.object({
  planId: id,
  promoCode: z.string().trim().max(32).optional(),
  useCredits: z.boolean().optional(),
});

export const extendSchema = z.object({ planId: id, useCredits: z.boolean().optional() });

export const usageSchema = z.object({
  units: z.number().int().min(1).max(100).default(1),
  action: text(1, 60).default("request"),
});

export const subscriptionCheckoutSchema = z.object({
  planCode: z.enum(["FREE", "STARTER", "PRO", "ELITE"]),
  interval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  promoCode: z.string().trim().max(32).optional(),
});

export const mockPaymentSchema = z.object({
  orderId: id,
  outcome: z.enum(["success", "failure"]),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: text(3, 80),
  body: text(10, 1000),
});

export const refundRequestSchema = z.object({ orderId: id, reason: text(10, 500) });

export const sellerApplicationSchema = z.object({
  displayName: text(2, 60),
  bio: text(20, 600),
  website: z.union([z.url("Enter a valid URL (https://…)."), z.literal("")]).optional(),
  country: z.string().length(2).default("IN"),
  authorization: z.object({
    kind: z.enum(["OWN_SERVICE", "OFFICIAL_API", "RESELLER_AGREEMENT", "CONTENT_LICENSE"]),
    title: text(3, 120),
    reference: text(3, 120),
    documentUrl: z.union([z.url(), z.literal("")]).optional(),
  }),
  acceptPolicy: z.literal(true, { error: "You must accept the provider policy." }),
});

export const listingSchema = z.object({
  name: text(3, 80),
  tagline: text(10, 140),
  description: text(40, 4000),
  categoryId: id,
  authorizationId: id,
  accessMethod: z.enum(["OFFICIAL_API", "OAUTH", "PROVIDER_TOKEN", "MANAGED_SERVICE"]),
  features: z.array(text(2, 100)).min(1).max(8),
  tags: z.array(text(2, 24)).max(8).default([]),
  capacity: z.number().int().min(1).max(100000).nullable().default(null),
  plans: z
    .array(
      z.object({
        durationMinutes: z.number().int().refine((m) => ALLOWED_DURATION_MINUTES.includes(m), "Unsupported duration."),
        priceMinor: z.number().int().min(1000, "Minimum price is ₹10.").max(100_000_000),
        usageLimit: z.number().int().min(1).nullable().default(null),
      }),
    )
    .min(1, "Add at least one rental option.")
    .max(7)
    .refine((plans) => new Set(plans.map((p) => p.durationMinutes)).size === plans.length, "Each duration can only be listed once."),
  submit: z.boolean().default(true),
});

export const payoutRequestSchema = z.object({ amountMinor: z.number().int().min(1) });

export const ticketSchema = z.object({ subject: text(4, 120), body: text(10, 2000) });

export const adminDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "suspend"]),
  notes: z.string().trim().max(500).optional(),
});
