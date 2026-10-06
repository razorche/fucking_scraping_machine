"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function PodesavanjaPage() {
  const [status, setStatus] = useState<object | null>(null);

  useEffect(() => {
    void fetch("/api/setup/status")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Podešavanja</h2>
        <p className="text-sm text-muted-foreground">Provera env i baze (server-side).</p>
        <Button variant="outline" onClick={() => window.open("/api/setup/status", "_blank")}>
          Otvori /api/setup/status
        </Button>
        {status && (
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-xs">
            {JSON.stringify(status, null, 2)}
          </pre>
        )}
      </div>
    </AppShell>
  );
}
