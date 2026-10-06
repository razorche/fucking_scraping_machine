import { AppShell } from "@/components/layout/app-shell";
import { InboxPageClient } from "@/components/inbox/inbox-page-client";

export default function InboxPage() {
  return (
    <AppShell>
      <InboxPageClient />
    </AppShell>
  );
}
