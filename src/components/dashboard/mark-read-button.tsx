"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

export function MarkReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button size="sm" variant="glass" loading={loading} onClick={async () => { setLoading(true); await api("/api/notifications", { method: "PATCH" }).catch(() => {}); router.refresh(); setLoading(false); }}>
      Mark all as read
    </Button>
  );
}
