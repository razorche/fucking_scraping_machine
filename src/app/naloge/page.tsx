import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function NalogePage() {
  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Gmail nalozi</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            OAuth 2.0 sa minimalnim scope-ovima. Tokeni se čuvaju enkriptovano; status zdravlja
            naloga se ažurira posle svake sync operacije.
          </p>
        </div>
        <Button asChild>
          <Link href="/api/auth/google">Poveži Gmail</Link>
        </Button>
      </div>
    </AppShell>
  );
}
