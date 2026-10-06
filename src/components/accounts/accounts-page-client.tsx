"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Account = {
  id: string;
  email: string;
  displayName: string | null;
  health: string;
  healthMessage: string | null;
  dailySendLimit: number;
  sentToday: number;
  lastErrorMessage: string | null;
};

export function AccountsPageClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function load() {
    const res = await fetch("/api/gmail/accounts");
    const data = await res.json();
    setAccounts(data.accounts ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/gmail/accounts");
      const data = await res.json();
      if (!cancelled) setAccounts(data.accounts ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function disconnect(id: string) {
    await fetch(`/api/gmail/accounts/${id}/disconnect`, { method: "POST" });
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Gmail nalozi</h2>
          <p className="text-sm text-muted-foreground">
            Više naloga — rotacija slanja po kvoti i opterećenju
          </p>
        </div>
        <Button asChild>
          <Link href="/api/auth/google">Poveži Gmail</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((acc) => (
          <article key={acc.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">{acc.email}</p>
                  <p className="text-xs text-muted-foreground">{acc.displayName}</p>
                </div>
              </div>
              <Badge
                className={
                  acc.health === "CONNECTED"
                    ? "border-success/30 text-success"
                    : "border-destructive/30 text-destructive"
                }
              >
                {acc.health === "CONNECTED" ? (
                  <CheckCircle2 className="mr-1 h-3 w-3 inline" aria-hidden />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3 inline" aria-hidden />
                )}
                {acc.health}
              </Badge>
            </div>
            <p className="mt-3 text-sm">
              Poslato danas: {acc.sentToday} / {acc.dailySendLimit}
            </p>
            {acc.healthMessage && (
              <p className="mt-1 text-xs text-muted-foreground">{acc.healthMessage}</p>
            )}
            {acc.lastErrorMessage && (
              <p className="mt-1 text-xs text-destructive">{acc.lastErrorMessage}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/google">Ponovo poveži</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void disconnect(acc.id)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Diskonektuj
              </Button>
            </div>
          </article>
        ))}
        {accounts.length === 0 && (
          <p className="text-muted-foreground md:col-span-2">
            Nema povezanih naloga. Klikni „Poveži Gmail“ za prvi nalog.
          </p>
        )}
      </div>
    </div>
  );
}
