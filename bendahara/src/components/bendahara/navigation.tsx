"use client";

import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ReceiptText, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/lib/types";

interface NavItem {
  key: ViewKey;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", short: "Beranda", icon: LayoutDashboard },
  { key: "income", label: "Pemasukan", short: "Masuk", icon: ArrowDownCircle },
  { key: "expense", label: "Pengeluaran", short: "Keluar", icon: ArrowUpCircle },
  { key: "transactions", label: "Transaksi", short: "Riwayat", icon: ReceiptText },
  { key: "reports", label: "Laporan", short: "Laporan", icon: FileBarChart },
];

interface NavigationProps {
  current: ViewKey;
  onChange: (v: ViewKey) => void;
}

/** Bottom navigation untuk mobile (HP/tablet) */
export function BottomNav({ current, onChange }: NavigationProps) {
  return (
    <nav
      className="md:hidden no-print fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <ul className="grid grid-cols-5 gap-0.5 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const active = current === item.key;
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onChange(item.key)}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-[10px] font-medium transition-colors min-h-[44px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-[22px] transition-transform",
                    active ? "scale-110" : ""
                  )}
                />
                <span className="leading-none">{item.short}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Top navigation untuk desktop/laptop */
export function TopNav({ current, onChange }: NavigationProps) {
  return (
    <nav
      className="hidden md:flex no-print items-center gap-1"
      role="navigation"
      aria-label="Navigasi utama"
    >
      {NAV_ITEMS.map((item) => {
        const active = current === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
