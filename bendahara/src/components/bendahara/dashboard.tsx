"use client";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Sparkles,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatRupiah,
  formatTanggalPendek,
  typeLabel,
} from "@/lib/format";
import type { Stats, Transaction, ViewKey } from "@/lib/types";
import { StatCard } from "./stat-card";

interface DashboardProps {
  stats: Stats;
  transactions: Transaction[];
  loading: boolean;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onViewAll: () => void;
  onSeedDemo: () => void;
  onClearAll: () => void;
  onRetry: () => void;
}

export function Dashboard({
  stats,
  transactions,
  loading,
  onAddIncome,
  onAddExpense,
  onViewAll,
  onSeedDemo,
  onClearAll,
  onRetry,
}: DashboardProps) {
  const recent = transactions.slice(0, 5);
  const isEmpty = !loading && transactions.length === 0;

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Judul halaman Dashboard */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan Keuangan Kas OSIS Adikara Darmalaksana
        </p>
      </div>

      {/* Hero saldo */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-md">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium">
            <Wallet className="size-4" />
            Saldo Saat Ini
          </div>
          <div className="mt-1.5 text-3xl sm:text-4xl font-bold tracking-tight tabular-nums break-words">
            {loading ? (
              <span className="inline-block h-9 w-44 rounded-md bg-white/20 animate-pulse align-middle" />
            ) : (
              formatRupiah(stats.balance)
            )}
          </div>
          <div className="mt-2 text-xs text-primary-foreground/70">
            Saldo = Total Pemasukan − Total Pengeluaran
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={onAddIncome}
              className="h-auto bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/20 shadow-none py-2.5"
            >
              <ArrowDownCircle className="size-5" />
              <span className="text-sm font-semibold">Pemasukan</span>
            </Button>
            <Button
              type="button"
              onClick={onAddExpense}
              className="h-auto bg-white/15 hover:bg-white/25 text-primary-foreground border border-white/20 shadow-none py-2.5"
            >
              <ArrowUpCircle className="size-5" />
              <span className="text-sm font-semibold">Pengeluaran</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Pemasukan"
          value={loading ? null : stats.totalIncome}
          icon={TrendingUp}
          tone="income"
        />
        <StatCard
          title="Pengeluaran"
          value={loading ? null : stats.totalExpense}
          icon={TrendingDown}
          tone="expense"
        />
        <StatCard
          title="Transaksi"
          value={loading ? null : stats.count}
          icon={Receipt}
          tone="primary"
          isCurrency={false}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Transaksi terbaru */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
            <div>
              <h2 className="text-base font-semibold">Transaksi Terbaru</h2>
              <p className="text-xs text-muted-foreground">
                5 transaksi paling baru
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="text-primary hover:text-primary"
            >
              Lihat semua
            </Button>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <ListSkeleton rows={5} />
            ) : recent.length === 0 ? (
              <div className="px-5 sm:px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <Receipt className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mulai catat pemasukan atau pengeluaran pertama Anda.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button size="sm" onClick={onAddIncome}>
                    <Plus className="size-4" /> Tambah Pemasukan
                  </Button>
                  <Button size="sm" variant="outline" onClick={onAddExpense}>
                    <Plus className="size-4" /> Tambah Pengeluaran
                  </Button>
                </div>
              </div>
            ) : (
              recent.map((t) => (
                <RecentItem key={t.id} tx={t} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aksi data */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Data masih kosong</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tambahkan beberapa data demo agar tampilan langsung terlihat,
                atau mulai catat transaksi sendiri. Data demo mudah dihapus
                kapan saja.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" onClick={onSeedDemo}>
                <Sparkles className="size-4" /> Isi Data Demo
              </Button>
              <Button size="sm" onClick={onAddIncome}>
                <Plus className="size-4" /> Tambah
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pengelolaan data (reset) - tampil saat ada data */}
      {!isEmpty && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium">Pengelolaan data</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Muat ulang data atau hapus seluruh transaksi untuk memulai
                dari awal.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="size-4" /> Muat Ulang
              </Button>
              <Button size="sm" variant="outline" onClick={onClearAll}>
                <Trash2 className="size-4" /> Hapus Semua
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecentItem({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === "income";
  return (
    <div className="flex items-center gap-3 px-5 sm:px-6 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isIncome
            ? "bg-income-soft text-income"
            : "bg-expense-soft text-expense"
        )}
      >
        {isIncome ? (
          <ArrowDownCircle className="size-5" />
        ) : (
          <ArrowUpCircle className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {tx.description}
          </p>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] px-1.5 py-0 h-4.5"
          >
            {tx.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatTanggalPendek(tx.date)} · {typeLabel(tx.type)}
        </p>
      </div>
      <div
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isIncome ? "text-income" : "text-expense"
        )}
      >
        {isIncome ? "+" : "−"}
        {formatRupiah(tx.amount)}
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-3">
          <div className="size-9 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </>
  );
}
