"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Menu } from "lucide-react";
import { useState } from "react";
import { APP_NAV, MOBILE_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions";
import { QuickAdd } from "@/components/quick-add";

export function AppShell({
  children,
  householdName,
  userName,
  categories,
}: {
  children: React.ReactNode;
  householdName: string;
  userName: string;
  categories: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen">
      <aside className="border-border bg-card fixed inset-y-0 left-0 z-30 hidden w-64 border-r px-4 py-6 lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-2xl">
            <Leaf className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold">LifeBudget</span>
            <span className="text-muted-foreground text-xs">
              {householdName}
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {APP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground hover:bg-muted hover:text-foreground block rounded-2xl px-3 py-2 text-sm font-medium",
                pathname === item.href && "bg-accent text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <Button variant="ghost" className="w-full justify-start">
            Sign out
          </Button>
        </form>
      </aside>

      <div className="lg:pl-64">
        <header className="border-border bg-background/90 sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="rounded-full p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-muted-foreground text-sm">Hello, {userName}</p>
          <QuickAdd categories={categories} />
        </header>
        {open ? (
          <div className="border-border bg-card border-b px-4 py-3 lg:hidden">
            <nav className="grid grid-cols-2 gap-2">
              {APP_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:bg-muted rounded-2xl px-3 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
        <main className="px-4 py-6 pb-24 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="border-border bg-card fixed right-0 bottom-0 left-0 z-20 grid grid-cols-5 border-t px-2 py-2 lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-muted-foreground rounded-2xl py-2 text-center text-xs font-medium",
              pathname === item.href && "bg-accent text-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
