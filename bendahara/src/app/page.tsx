"use client";

import { useCallback, useState } from "react";
import { Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { BottomNav, TopNav } from "@/components/bendahara/navigation";
import { Dashboard } from "@/components/bendahara/dashboard";
import { TransactionFormInline } from "@/components/bendahara/transaction-form-inline";
import { TransactionFormDialog } from "@/components/bendahara/transaction-form-dialog";
import { TransactionList } from "@/components/bendahara/transaction-list";
import { Reports } from "@/components/bendahara/reports";
import { useBendahara } from "@/hooks/use-bendahara";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, TransactionType, ViewKey } from "@/lib/types";

export default function Home() {
  const {
    transactions,
    stats,
    loading,
    error,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    seedDemo,
    clearAll,
  } = useBendahara();

  const { toast } = useToast();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [formType, setFormType] = useState<TransactionType>("income");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const openAddDialog = useCallback((type: TransactionType) => {
    setFormType(type)
    setEditing(null)
    setDialogOpen(true)
  }, [])

  const handleAddIncome = useCallback(() => {
    setView("income")
    // scroll ke atas
    if (typeof window !== "undefined") window.scrollTo({ top: 0 })
  }, [])
  const handleAddExpense = useCallback(() => {
    setView("expense")
    if (typeof window !== "undefined") window.scrollTo({ top: 0 })
  }, [])

  const handleEditFromList = useCallback((tx: Transaction) => {
    setEditing(tx)
    setFormType(tx.type)
    setDialogOpen(true)
  }, [])

  const handleSeedDemo = useCallback(async () => {
    const res = await seedDemo()
    if (res.ok) {
      toast({
        title: "Data demo ditambahkan",
        description:
          res.inserted && res.inserted > 0
            ? `${res.inserted} transaksi contoh berhasil dimuat.`
            : res.message,
      })
    } else {
      toast({
        title: "Gagal",
        description: res.error,
        variant: "destructive",
      })
    }
  }, [seedDemo, toast])

  const handleClearAll = useCallback(async () => {
    const res = await clearAll()
    setClearOpen(false)
    if (res.ok) {
      toast({
        title: "Data dihapus",
        description: res.message,
      })
    } else {
      toast({
        title: "Gagal",
        description: res.error,
        variant: "destructive",
      })
    }
  }, [clearAll, toast])

  const handleDelete = useCallback(
    async (tx: Transaction) => {
      const res = await deleteTransaction(tx.id)
      if (res.ok) {
        toast({
          title: "Transaksi dihapus",
          description: `"${tx.description}" telah dihapus.`,
        })
      } else {
        toast({
          title: "Gagal menghapus",
          description: res.error,
          variant: "destructive",
        })
      }
    },
    [deleteTransaction, toast]
  )

  const handleCreate = useCallback(
    async (values: {
      type: TransactionType
      date: string
      description: string
      amount: number
      category: string
    }) => {
      const res = await createTransaction(values)
      if (res.ok) {
        toast({
          title: "Transaksi berhasil disimpan",
          description: `${values.type === "income" ? "Pemasukan" : "Pengeluaran"} sebesar Rp${values.amount.toLocaleString(
            "id-ID"
          )} telah dicatat.`,
        })
        return { ok: true as const }
      }
      // Jika ada field error spesifik, kembalikan; jika tidak, tampilkan error umum
      return {
        ok: false as const,
        error: res.error,
        fieldErrors: res.fieldErrors,
      }
    },
    [createTransaction, toast]
  )

  const handleUpdate = useCallback(
    async (values: {
      type: TransactionType
      date: string
      description: string
      amount: number
      category: string
    }) => {
      if (!editing) return { ok: false as const, error: "Tidak ada data." }
      const res = await updateTransaction(editing.id, values)
      if (res.ok) {
        toast({
          title: "Transaksi diperbarui",
          description: "Perubahan telah disimpan.",
        })
        return { ok: true as const }
      }
      return {
        ok: false as const,
        error: res.error,
        fieldErrors: res.fieldErrors,
      }
    },
    [editing, updateTransaction, toast]
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header (sticky) */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md no-print">
        <div className="mx-auto max-w-5xl px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Wallet className="size-5 sm:size-5.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none truncate">
                  Bendahara
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-none truncate">
                  Catatan Keuangan Sederhana
                </p>
              </div>
            </div>
            <TopNav current={view} onChange={setView} />
          </div>
        </div>
      </header>

      {/* Konten utama */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-8">
        {/* Error banner global */}
        {error && (
          <Card className="mb-4 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {error}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Periksa koneksi lalu coba muat ulang.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={refresh}>
                <RefreshCw className="size-4" /> Muat Ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {view === "dashboard" && (
          <Dashboard
            stats={stats}
            transactions={transactions}
            loading={loading}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
            onViewAll={() => setView("transactions")}
            onSeedDemo={handleSeedDemo}
            onClearAll={() => setClearOpen(true)}
            onRetry={refresh}
          />
        )}

        {view === "income" && (
          <TransactionFormInline
            type="income"
            onSubmit={handleCreate}
            onGoToTransactions={() => setView("transactions")}
          />
        )}

        {view === "expense" && (
          <TransactionFormInline
            type="expense"
            onSubmit={handleCreate}
            onGoToTransactions={() => setView("transactions")}
          />
        )}

        {view === "transactions" && (
          <TransactionList
            transactions={transactions}
            loading={loading}
            onAddIncome={() => openAddDialog("income")}
            onAddExpense={() => openAddDialog("expense")}
            onEdit={handleEditFromList}
            onDelete={handleDelete}
          />
        )}

        {view === "reports" && (
          <Reports transactions={transactions} loading={loading} />
        )}
      </main>

      {/* Footer sticky di bawah (desktop) */}
      <footer className="mt-auto border-t border-border bg-card/85 backdrop-blur-md no-print hidden md:block">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} Bendahara · Catatan keuangan sederhana
          </span>
          <span className="tabular-nums">
            Saldo:{" "}
            <span
              className={
                stats.balance < 0
                  ? "text-expense font-semibold"
                  : "text-primary font-semibold"
              }
            >
              Rp{stats.balance.toLocaleString("id-ID")}
            </span>
          </span>
        </div>
      </footer>

      {/* Bottom nav mobile */}
      <BottomNav current={view} onChange={setView} />

      {/* Dialog form (untuk tambah cepat & edit) */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={formType}
        initial={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Konfirmasi hapus semua */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus semua transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua transaksi ({stats.count}) akan dihapus permanen dan tidak
              dapat dikembalikan. Saldo akan menjadi nol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              Ya, hapus semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
