"use client";

import { useEffect, useState } from "react";
import { Upload, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ParsedLeadInput } from "@/lib/import/types";

type LeadRow = {
  id: string;
  email: string;
  company: string | null;
  ownerName: string | null;
  state: string | null;
  dotNumber: string | null;
  powerUnits: number | null;
  leadStatus: string;
};

export function LeadsPageClient() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "done">("upload");
  const [preview, setPreview] = useState<{
    leads: ParsedLeadInput[];
    fileName: string;
    dedupe?: { duplicates: number; suppressed: number; newLeads: number };
    validRows: number;
    invalidRows: number;
    rowErrors: string[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      if (cancelled) return;
      setLeads(data.items ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  async function loadLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  async function onFile(file: File) {
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/leads/import?mode=preview", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Greška pri parsiranju");
      return;
    }
    setPreview(data);
    setImportStep("preview");
  }

  async function commitImport() {
    if (!preview) return;
    setLoading(true);
    const res = await fetch("/api/leads/import?mode=commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: preview.fileName, leads: preview.leads }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage("Commit nije uspeo");
      return;
    }
    setMessage(
      `Uvezeno: ${data.imported}, duplikati: ${data.duplicates}, potisnuto: ${data.suppressed}`,
    );
    setImportStep("done");
    setImportOpen(false);
    void loadLeads();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Lidovi</h2>
          <p className="text-sm text-muted-foreground">CSV, TSV, TXT i ZIP (FMCSA paketi)</p>
        </div>
        <Button onClick={() => { setImportOpen(true); setImportStep("upload"); setPreview(null); }}>
          <Upload className="h-4 w-4" aria-hidden />
          Uvezi lidove
        </Button>
      </div>

      {message && (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm">{message}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            className="pl-8"
            placeholder="Pretraga email, firma, DOT..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => void loadLeads()} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Osveži
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Ukupno: {total}</p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Firma</th>
              <th className="px-3 py-2">Država</th>
              <th className="px-3 py-2">DOT</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <td className="px-3 py-2">{lead.email}</td>
                <td className="px-3 py-2">{lead.company ?? "—"}</td>
                <td className="px-3 py-2">{lead.state ?? "—"}</td>
                <td className="px-3 py-2">{lead.dotNumber ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge>{lead.leadStatus}</Badge>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  Nema lidova — uvezi prvi fajl.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Uvoz lidova</h3>
            {importStep === "upload" && (
              <div className="mt-4 space-y-3">
                <Input
                  type="file"
                  accept=".csv,.tsv,.txt,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                  }}
                />
              </div>
            )}
            {importStep === "preview" && preview && (
              <div className="mt-4 space-y-3 text-sm">
                <p>Fajl: {preview.fileName}</p>
                <p>Validnih redova: {preview.validRows}, nevalidnih: {preview.invalidRows}</p>
                {preview.dedupe && (
                  <p>
                    Novih: {preview.dedupe.newLeads}, duplikata: {preview.dedupe.duplicates}, potisnuto:{" "}
                    {preview.dedupe.suppressed}
                  </p>
                )}
                {preview.rowErrors.slice(0, 5).map((err) => (
                  <p key={err} className="text-destructive">
                    {err}
                  </p>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => void commitImport()} disabled={loading}>
                    Potvrdi uvoz
                  </Button>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    Otkaži
                  </Button>
                </div>
              </div>
            )}
            <Button variant="ghost" className="mt-4" onClick={() => setImportOpen(false)}>
              Zatvori
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
