"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export function ReviewForm({ serviceId }: { serviceId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api(`/api/reviews/${serviceId}`, { body: { rating, title, body } });
      toast({ tone: "success", message: "Thanks — your review is live." });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-ivory">Review this service</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
            <Star className={cn("h-6 w-6 transition-colors", n <= rating ? "fill-gold-400 text-gold-400" : "text-smoke")} />
          </button>
        ))}
      </div>
      <Field label="Title" htmlFor="rv-title"><Input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={80} /></Field>
      <Field label="Your experience" htmlFor="rv-body"><Textarea id="rv-body" value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} maxLength={1000} /></Field>
      <FormError message={error} />
      <Button type="submit" loading={loading} size="sm">Publish review</Button>
    </form>
  );
}
