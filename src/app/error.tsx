"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[100svh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-ivory">Something went wrong.</h1>
        <p className="mt-2 text-fog">Please try again. If the problem continues, contact support{error.digest ? ` with reference ${error.digest}` : ""}.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
