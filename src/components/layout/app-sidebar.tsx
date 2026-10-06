"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/", label: "Kontrolna tabla", icon: LayoutDashboard },
  { href: "/kampanje", label: "Kampanje", icon: Megaphone },
  { href: "/lidovi", label: "Lidovi", icon: Users },
  { href: "/naloge", label: "Gmail nalozi", icon: Mail },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/analitika", label: "Analitika", icon: BarChart3 },
  { href: "/podesavanja", label: "Podešavanja", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          FOM
        </p>
        <h1 className="text-lg font-semibold text-foreground">Outreach Mašina</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
