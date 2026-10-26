"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api, ClientApiError } from "@/lib/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FavoriteButton({ serviceId, initial, className, withLabel = false }: { serviceId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    start(async () => {
      try {
        await api(`/api/favorites/${serviceId}`, { method: next ? "POST" : "DELETE" });
        toast({ tone: "success", message: next ? "Saved to your wishlist" : "Removed from wishlist" });
        router.refresh();
      } catch (err) {
        setFav(!next);
        if (err instanceof ClientApiError && err.status === 401) router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        else toast({ tone: "error", message: (err as Error).message });
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 text-ivory backdrop-blur-sm transition-all hover:border-gold-400/50 active:scale-90",
        withLabel ? "h-11 px-4 text-sm font-medium" : "h-9 w-9",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-gold-400 text-gold-400" : "text-ivory")} />
      {withLabel && (fav ? "Saved" : "Save")}
    </button>
  );
}
