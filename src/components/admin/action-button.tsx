"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";

/** Calls an admin endpoint, optionally asking for confirmation and notes first. */
export function ActionButton({
  endpoint, method = "POST", body, label, variant = "ghost", confirm, withNotes, success,
}: {
  endpoint: string; method?: "POST" | "PATCH" | "DELETE"; body?: Record<string, unknown>; label: string; variant?: ButtonVariant;
  confirm?: string; withNotes?: boolean; success?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      await api(endpoint, { method, body: withNotes ? { ...body, notes: notes || undefined } : body });
      toast({ tone: "success", message: success ?? "Done" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ tone: "error", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant={variant} loading={loading && !open} onClick={() => (confirm || withNotes ? setOpen(true) : run())}>{label}</Button>
      {(confirm || withNotes) && (
        <Dialog open={open} onClose={() => setOpen(false)} title={label} description={confirm}>
          {withNotes && <Field label="Notes (shared with the user where relevant)" htmlFor="admin-notes"><Textarea id="admin-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} /></Field>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={variant === "danger" ? "danger" : "gold"} onClick={run} loading={loading}>{label}</Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
