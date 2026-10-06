import { AppShell } from "@/components/layout/app-shell";

export default function LidoviPage() {
  return (
    <AppShell>
      <h2 className="text-2xl font-semibold">Lidovi</h2>
      <p className="mt-2 text-muted-foreground">
        Uvoz CSV/TSV/TXT/ZIP (uključujući FMCSA pakete) — u implementaciji (Pass 0015+).
      </p>
    </AppShell>
  );
}
