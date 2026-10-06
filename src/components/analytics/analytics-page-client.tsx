"use client";

import { useEffect, useState } from "react";

export function AnalyticsPageClient() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    void fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-muted-foreground">Učitavanje...</p>;

  const cards = [
    { label: "Lidovi", value: stats.leads },
    { label: "Gmail nalozi (connected)", value: stats.accounts },
    { label: "Poslato", value: stats.sent },
    { label: "Neuspešno", value: stats.failed },
    { label: "Kampanje", value: stats.campaigns },
    { label: "Otvaranja (pixel)", value: stats.opens },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analitika</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-3xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
