"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  formatRupiah,
  formatTanggal,
  formatTanggalPendek,
  toDateInputValue,
  typeLabel,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

type TypeFilter = "all" | "income" | "expense";

export function TransactionList({
  transactions,
  loading,
  onAddIncome,
  onAddExpense,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (new Date(t.date) < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (new Date(t.date) > e) return false;
      }
      if (q) {
        const hay = (
          t.description +
          " " +
          t.category +
          " " +
          typeLabel(t.type)
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, startDate, endDate]);

  const hasFilter =
    !!search || typeFilter !== "all" || !!startDate || !!endDate;

  function resetFilter() {
    setSearch("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
  }

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header + tombol tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Transaksi
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transaksi ditampilkan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAddIncome}
            className="flex-1 sm:flex-none"
          >
            <ArrowDownCircle className="size-4 text-income" />
            Pemasukan
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddExpense}
            className="flex-1 sm:flex-none"
          >
            <ArrowUpCircle className="size-4 text-expense" />
            Pengeluaran
          </Button>
        </div>
      </div>

      {/* Ringkasan hasil filter */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MiniStat label="Pemasukan" value={totalIncome} tone="income" />
        <MiniStat label="Pengeluaran" value={totalExpense} tone="expense" />
        <MiniStat
          label="Selisih"
          value={totalIncome - totalExpense}
          tone="primary"
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari keterangan atau kategori..."
              className="pl-9"
              aria-label="Cari transaksi"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label="Hapus pencarian"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger aria-label="Filter jenis" className="w-full">
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Tanggal mulai"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="Tanggal akhir"
                className="pl-9"
              />
            </div>
          </div>

          {hasFilter && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Filter aktif. Menampilkan {filtered.length} dari{" "}
                {transactions.length} transaksi.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilter}
                className="h-7 text-xs"
              >
                <X className="size-3.5" /> Reset filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daftar transaksi */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop: tabel */}
          <div className="hidden md:block overflow-x-auto scroll-soft">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[120px]">Tanggal</TableHead>
                  <TableHead className="w-[110px]">Jenis</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-[140px]">
                    Kategori/Sumber
                  </TableHead>
                  <TableHead className="text-right w-[140px]">Nominal</TableHead>
                  <TableHead className="w-[100px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={6} />
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <EmptyState onAdd={onAddIncome} />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatTanggalPendek(t.date)}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={t.type} />
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[320px] truncate">
                        {t.description}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.category}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums whitespace-nowrap",
                          t.type === "income" ? "text-income" : "text-expense"
                        )}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatRupiah(t.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => onEdit(t)}
                            aria-label="Edit transaksi"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(t)}
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              <MobileSkeleton rows={6} />
            ) : filtered.length === 0 ? (
              <div className="py-12">
                <EmptyState onAdd={onAddIncome} />
              </div>
            ) : (
              filtered.map((t) => (
                <MobileItem
                  key={t.id}
                  tx={t}
                  onEdit={() => onEdit(t)}
                  onDelete={() => setConfirmDelete(t)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus
                  permanen dari database.
                </p>
                {confirmDelete && (
                  <p className="text-sm font-medium text-foreground">
                    {confirmDelete.description} —{" "}
                    {formatTanggal(confirmDelete.date)}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) onDelete(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              <Trash2 className="size-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 sm:px-4 sm:py-3",
        tone === "income"
          ? "border-income/20 bg-income-soft/50"
          : tone === "expense"
            ? "border-expense/20 bg-expense-soft/50"
            : "border-primary/20 bg-primary/5"
      )}
    >
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
        {label}
      </p>
      <p
        className={cn(
          "text-xs sm:text-base font-bold tabular-nums truncate",
          tone === "income"
            ? "text-income"
            : tone === "expense"
              ? "text-expense"
              : value < 0
                ? "text-expense"
                : "text-primary"
        )}
      >
        {formatRupiah(value)}
      </p>
    </div>
  );
}

function TypeBadge({ type }: { type: "income" | "expense" }) {
  const isIncome = type === "income";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isIncome
          ? "bg-income-soft text-income"
          : "bg-expense-soft text-expense"
      )}
    >
      {isIncome ? (
        <ArrowDownCircle className="size-3" />
      ) : (
        <ArrowUpCircle className="size-3" />
      )}
      {typeLabel(type)}
    </span>
  );
}

function MobileItem({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = tx.type === "income";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
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
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{tx.description}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {formatTanggalPendek(tx.date)} · {tx.category}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className={cn(
            "text-sm font-semibold tabular-nums whitespace-nowrap",
            isIncome ? "text-income" : "text-expense"
          )}
        >
          {isIncome ? "+" : "−"}
          {formatRupiah(tx.amount)}
        </div>
        <div className="mt-1 flex justify-end gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Hapus"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Receipt className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Tidak ada transaksi</p>
        <p className="text-xs text-muted-foreground">
          Coba ubah filter atau tambah transaksi baru.
        </p>
      </div>
      <Button size="sm" onClick={onAdd}>
        <Plus className="size-4" /> Tambah Transaksi
      </Button>
    </div>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-3.5 w-full max-w-[140px] rounded bg-muted animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function MobileSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </>
  );
}
