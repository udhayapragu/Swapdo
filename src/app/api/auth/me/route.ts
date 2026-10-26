import { handler, json } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/session";

export const GET = handler(async () => json({ user: await getCurrentUser() }));
