import Link from "next/link";
import { ArrowRight, Mail, Shield, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Fucking Outreach MACHINE</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Dobrodošli u produkcioni outreach motor
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Povežite Gmail naloge, uvezite lidove (CSV/TSV/TXT/ZIP), pokrenite sekvence sa
            idempotentnom slanjem i pratite odgovore — bez demo lažnih integracija.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              title: "Gmail OAuth",
              desc: "Least privilege gmail.send, enkriptovani tokeni, zdravlje naloga.",
            },
            {
              icon: Shield,
              title: "Bezbednost",
              desc: "Supresija, deduplikacija, CSV formula zaštita, tenant izolacija.",
            },
            {
              icon: Zap,
              title: "Sekvence",
              desc: "Email, čekanje, uslovi, webhook — red čekanja sa idempotency ključevima.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <Icon className="mb-2 h-5 w-5 text-accent" aria-hidden />
              <h3 className="font-medium text-card-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/naloge">
              Poveži Gmail
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/lidovi">Uvezi lidove</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/kampanje">Nova kampanja</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
