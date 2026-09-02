"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Home,
  Landmark,
  Leaf,
  Menu,
  Receipt,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { APP_NAV, MOBILE_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions";
import { QuickAdd } from "@/components/quick-add";

const MOBILE_ICONS = {
  "/dashboard": Home,
  "/transactions": Receipt,
  "/budget": Wallet,
  "/goals": Flag,
  "/house": Landmark,
} as const;

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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-zinc-950 px-4 py-6 text-white lg:flex lg:flex-col">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="bg-mint text-foreground flex h-9 w-9 items-center justify-center rounded-full">
            <Leaf className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold">LifeBudget</span>
            <span className="text-white/70 text-xs">{householdName}</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {APP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-white/70 hover:bg-white/10 hover:text-white block rounded-full px-3 py-2 text-sm font-medium",
                pathname === item.href &&
                  "bg-white text-zinc-950 hover:bg-white hover:text-zinc-950",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            className="hover:bg-white/10 w-full justify-start text-white hover:text-white"
          >
            Sign out
          </Button>
        </form>
      </aside>

      <div className="lg:pl-64">
        <header className="bg-background/90 sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur lg:px-8">
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
          <div className="bg-card mx-4 mb-2 rounded-[1.75rem] px-4 py-3 lg:hidden">
            <nav className="grid grid-cols-2 gap-2">
              {APP_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:bg-muted rounded-full px-3 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={signOutAction} className="mt-3">
              <Button variant="ghost" className="w-full justify-start">
                Sign out
              </Button>
            </form>
          </div>
        ) : null}
        <main className="px-4 py-6 pb-28 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-20 mx-auto flex max-w-md items-center justify-between rounded-full bg-zinc-950 px-2 py-2 text-white lg:hidden">
        {MOBILE_NAV.map((item) => {
          const Icon = MOBILE_ICONS[item.href];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold",
                active
                  ? "bg-white text-zinc-950"
                  : "text-white/80",
              )}
            >
              <Icon className="h-4 w-4" />
              {active ? item.label : <span className="sr-only">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
