"use client";

import { useEffect, useState } from "react";
import { Megaphone, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Campaign = {
  id: string;
  name: string;
  status: string;
  _count: { enrollments: number };
  gmailAccounts: { gmailAccount: { email: string } }[];
};

type Account = { id: string; email: string; health: string };

export function CampaignsPageClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [subject1, setSubject1] = useState("Brzi ping za {{company}}");
  const [body1, setBody1] = useState(
    "Zdravo {{firstName}},\n\nJavljam se u vezi operativa na {{company}}. Imate 2 minuta ove nedelje?\n",
  );
  const [subject2, setSubject2] = useState("Re: {{company}} — kratak follow-up");
  const [body2, setBody2] = useState(
    "Hej {{firstName}}, samo podbijam poruku u vezi {{company}}. Da li vam odgovara kratki poziv?\n",
  );
  const [waitDays, setWaitDays] = useState(3);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const [cRes, aRes] = await Promise.all([
      fetch("/api/campaigns"),
      fetch("/api/gmail/accounts"),
    ]);
    const cData = await cRes.json();
    const aData = await aRes.json();
    setCampaigns(cData.campaigns ?? []);
    setAccounts((aData.accounts ?? []).filter((a: Account) => a.health === "CONNECTED"));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cRes, aRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/gmail/accounts"),
      ]);
      const cData = await cRes.json();
      const aData = await aRes.json();
      if (cancelled) return;
      setCampaigns(cData.campaigns ?? []);
      setAccounts((aData.accounts ?? []).filter((a: Account) => a.health === "CONNECTED"));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function createCampaign(launch: boolean) {
    setMsg(null);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        gmailAccountIds: selectedAccounts,
        subject1,
        body1,
        subject2,
        body2,
        waitDays,
        launch,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Greška");
      return;
    }
    setMsg(
      launch
        ? `Kampanja pokrenuta — enrollment: ${data.launch?.enrolled ?? 0}`
        : "Kampanja sačuvana (draft)",
    );
    setName("");
    void load();
  }

  async function launchExisting(id: string) {
    const res = await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
    const data = await res.json();
    setMsg(res.ok ? `Pokrenuto enrollment: ${data.enrolled}` : data.error);
    void load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Kampanje</h2>
        <p className="text-sm text-muted-foreground">Sekvenca Email → čekanje → follow-up</p>
      </div>

      {msg && <p className="rounded-md border border-border bg-card px-3 py-2 text-sm">{msg}</p>}

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <Megaphone className="h-4 w-4" aria-hidden />
          Nova kampanja
        </h3>
        <Input placeholder="Naziv kampanje" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-muted-foreground">Gmail nalozi (multi-select)</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <Button
              key={a.id}
              type="button"
              size="sm"
              variant={selectedAccounts.includes(a.id) ? "default" : "outline"}
              onClick={() => toggleAccount(a.id)}
            >
              {a.email}
            </Button>
          ))}
        </div>
        <Input value={subject1} onChange={(e) => setSubject1(e.target.value)} placeholder="Subject 1" />
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm"
          value={body1}
          onChange={(e) => setBody1(e.target.value)}
        />
        <Input
          type="number"
          min={1}
          max={30}
          value={waitDays}
          onChange={(e) => setWaitDays(parseInt(e.target.value, 10) || 3)}
        />
        <Input value={subject2} onChange={(e) => setSubject2(e.target.value)} placeholder="Subject 2" />
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm"
          value={body2}
          onChange={(e) => setBody2(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            disabled={!name || selectedAccounts.length === 0}
            onClick={() => void createCampaign(false)}
          >
            Sačuvaj draft
          </Button>
          <Button
            disabled={!name || selectedAccounts.length === 0}
            onClick={() => void createCampaign(true)}
          >
            <Rocket className="h-4 w-4" aria-hidden />
            Pokreni odmah
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Aktivne kampanje</h3>
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                Enrollment: {c._count.enrollments} · Nalozi:{" "}
                {c.gmailAccounts.map((g) => g.gmailAccount.email).join(", ") || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{c.status}</Badge>
              {c.status === "DRAFT" && (
                <Button size="sm" variant="outline" onClick={() => void launchExisting(c.id)}>
                  Launch
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
