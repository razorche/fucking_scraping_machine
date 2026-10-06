"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Thread = {
  id: string;
  subject: string | null;
  classification: string;
  lastMessageAt: string | null;
  lead: { email: string; company: string | null };
};

export function InboxPageClient() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    void fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => setThreads(d.threads ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Inbox</h2>
      <p className="text-sm text-muted-foreground">
        Threadovi iz baze. Pub/Sub Gmail sync dolazi u sledećem sprintu.
      </p>
      <div className="space-y-2">
        {threads.map((t) => (
          <div key={t.id} className="rounded-lg border border-border p-3">
            <div className="flex justify-between gap-2">
              <p className="font-medium">{t.subject ?? "(bez subjecta)"}</p>
              <Badge>{t.classification}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.lead.email} · {t.lead.company ?? "—"}
            </p>
          </div>
        ))}
        {threads.length === 0 && (
          <p className="text-muted-foreground">Nema threadova — odgovori će se pojaviti posle sync-a.</p>
        )}
      </div>
    </div>
  );
}
