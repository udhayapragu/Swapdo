"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return <Button variant="glass" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / save PDF</Button>;
}
