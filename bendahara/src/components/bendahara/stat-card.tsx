"use client";

import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | null; // null = loading
  icon: LucideIcon;
  tone?: "income" | "expense" | "primary";
  className?: string;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
  className,
  isCurrency = true,
}: StatCardProps) {
  const toneClasses =
    tone === "income"
      ? "bg-income-soft text-income"
      : tone === "expense"
        ? "bg-expense-soft text-expense"
        : "bg-primary/10 text-primary";

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <div
            className={cn(
              "flex size-8 sm:size-9 items-center justify-center rounded-full",
              toneClasses
            )}
          >
            <Icon className="size-4 sm:size-5" />
          </div>
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums break-words">
          {value === null ? (
            <span className="inline-block h-7 w-24 rounded bg-muted animate-pulse align-middle" />
          ) : isCurrency ? (
            formatRupiah(value)
          ) : (
            value.toLocaleString("id-ID")
          )}
        </div>
      </CardContent>
    </Card>
  );
}
