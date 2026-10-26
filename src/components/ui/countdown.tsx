"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/**
 * Display-only countdown. It is anchored to the server's clock (serverNow) so a
 * skewed device clock can't distort it — and access is enforced server-side regardless.
 */
export function Countdown({ endsAt, serverNow, className, refreshOnEnd = true }: { endsAt: string; serverNow: string; className?: string; refreshOnEnd?: boolean }) {
  const router = useRouter();
  const offset = useRef<number | null>(null);
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - new Date(serverNow).getTime());
  const fired = useRef(false);

  useEffect(() => {
    offset.current = new Date(serverNow).getTime() - Date.now();
    const tick = () => {
      const left = new Date(endsAt).getTime() - (Date.now() + (offset.current ?? 0));
      setRemaining(left);
      if (left <= 0 && refreshOnEnd && !fired.current) {
        fired.current = true;
        router.refresh();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, serverNow, refreshOnEnd, router]);

  return (
    <time dateTime={endsAt} className={cn("font-mono tabular-nums", className)} aria-live="off" suppressHydrationWarning>
      {formatRemaining(remaining)}
    </time>
  );
}
