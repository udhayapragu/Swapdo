import { getCurrentUser } from "@/lib/auth/session";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <HeaderClient user={user ? { name: user.name, email: user.email, role: user.role, isSeller: !!user.sellerId } : null} />;
}
