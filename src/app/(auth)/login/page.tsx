import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { demoModeEnabled } from "@/lib/demo";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const demo = demoModeEnabled()
    ? [{ label: "Customer", email: "user@swapdo.dev" }, { label: "Seller", email: "seller@swapdo.dev" }, { label: "Admin", email: "admin@swapdo.dev" }]
    : undefined;
  return (
    <Suspense>
      <AuthForm mode="login" demoAccounts={demo} />
    </Suspense>
  );
}
