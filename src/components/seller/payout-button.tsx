"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

export function PayoutButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <Button disabled={disabled} loading={loading} onClick={async () => {
      setLoading(true);
      try { await api("/api/seller/payouts", { method: "POST" }); toast({ tone: "success", message: "Payout requested." }); router.refresh(); }
      catch (err) { toast({ tone: "error", message: (err as Error).message }); }
      setLoading(false);
    }}>Request payout</Button>
  );
}
