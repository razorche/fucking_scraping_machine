import { AppShell } from "@/components/layout/app-shell";
import { AccountsPageClient } from "@/components/accounts/accounts-page-client";

export default function NalogePage() {
  return (
    <AppShell>
      <AccountsPageClient />
    </AppShell>
  );
}
