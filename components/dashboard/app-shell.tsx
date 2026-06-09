"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  CircleDollarSign,
  Database,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Search,
  Settings,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sales", label: "Sales", icon: CircleDollarSign },
  { href: "/dashboard/purchases", label: "Purchases", icon: ReceiptText },
  { href: "/dashboard/expenses", label: "Expenses", icon: HandCoins },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Store },
  { href: "/dashboard/salary", label: "Salary", icon: CreditCard },
  { href: "/dashboard/data", label: "Data", icon: Database },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            TL
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Toleads</div>
            <div className="truncate text-xs text-muted-foreground">Production</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-secondary text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <button className="inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium shadow-sm">
                Toleads PO Dashboard
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="hidden rounded-md border bg-secondary px-2 py-1 text-xs text-muted-foreground md:block">
                Local JSON
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-white px-3 text-xs font-medium text-muted-foreground",
                      active && "bg-secondary text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 bg-secondary pl-9 shadow-none"
                  placeholder="Search purchases, suppliers..."
                />
              </div>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white shadow-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                TS
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
