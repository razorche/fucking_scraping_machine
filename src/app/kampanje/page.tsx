import { AppShell } from "@/components/layout/app-shell";
import { CampaignsPageClient } from "@/components/campaigns/campaigns-page-client";

export default function KampanjePage() {
  return (
    <AppShell>
      <CampaignsPageClient />
    </AppShell>
  );
}
