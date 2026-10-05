"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Loader2,
  Save,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  formatRupiah,
  formatRupiahInput,
  parseRupiahInput,
  toDateInputValue,
} from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  type TransactionType,
} from "@/lib/types";

interface TransactionFormInlineProps {
  type: TransactionType;
  onSubmit: (values: {
    type: TransactionType;
    date: string;
    description: string;
    amount: number;
    category: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  >;
  onGoToTransactions?: () => void;
}

export function TransactionFormInline({
  type,
  onSubmit,
  onGoToTransactions,
}: TransactionFormInlineProps) {
  const isIncome = type === "income";
  const options = isIncome ? INCOME_SOURCES : EXPENSE_CATEGORIES;

  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amount = useMemo(() => parseRupiahInput(amountRaw), [amountRaw]);

  function resolveCategory(): string {
    if (category === "Lainnya" || (category === "" && customCategory.trim())) {
      return customCategory.trim();
    }
    return category;
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!date) e.date = "Tanggal wajib diisi."
    else if (isNaN(new Date(date).getTime())) e.date = "Tanggal tidak valid."
    if (!description.trim()) e.description = "Keterangan wajib diisi."
    else if (description.trim().length > 200) e.description = "Keterangan maksimal 200 karakter."
    if (!amount || amount <= 0) e.amount = "Nominal harus lebih dari 0."
    if (!resolveCategory()) e.category = "Kategori wajib dipilih."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function resetForm() {
    setDate(toDateInputValue(new Date()))
    setDescription("")
    setAmountRaw("")
    setCategory("")
    setCustomCategory("")
    setErrors({})
    setSubmitError(null)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setSubmitError(null)
    setSuccess(false)
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit({
      type,
      date,
      description: description.trim(),
      amount,
      category: resolveCategory(),
    })
    setSubmitting(false)

    if (result.ok) {
      setSuccess(true)
      resetForm()
      // sembunyikan pesan sukses otomatis setelah beberapa detik
      setTimeout(() => setSuccess(false), 4000)
    } else {
      setSubmitError(result.error || "Terjadi kesalahan.")
      if (result.fieldErrors) setErrors(result.fieldErrors)
    }
  }

  const title = isIncome ? "Tambah Pemasukan" : "Tambah Pengeluaran"
  const desc = isIncome
    ? "Catat uang masuk, misalnya kas kelas, iuran, atau donasi."
    : "Catat pengeluaran, misalnya beli ATK, konsumsi, atau kegiatan."

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl shadow-sm",
            isIncome
              ? "bg-income text-income-foreground"
              : "bg-expense text-expense-foreground"
          )}
        >
          {isIncome ? (
            <ArrowDownCircle className="size-6" />
          ) : (
            <ArrowUpCircle className="size-6" />
          )}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>

      {/* Pesan sukses */}
      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-income/30 bg-income-soft/60 px-4 py-3 text-sm text-income animate-fade-in-up"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Transaksi berhasil disimpan.</p>
            <p className="text-xs text-income/80">
              Saldo telah diperbarui secara otomatis.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={toDateInputValue(new Date())}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-desc">
                Keterangan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tx-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isIncome
                    ? "cth: Uang kas bulanan kelas"
                    : "cth: Membeli alat tulis"
                }
                maxLength={200}
                aria-invalid={!!errors.description}
              />
              {errors.description ? (
                <p className="text-xs text-destructive">{errors.description}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {description.length}/200 karakter
                </p>
              )}
            </div>

            {/* Nominal */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">
                Nominal (Rp) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  Rp
                </span>
                <Input
                  id="tx-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amountRaw}
                  onChange={(e) =>
                    setAmountRaw(formatRupiahInput(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 tabular-nums text-base"
                  aria-invalid={!!errors.amount}
                />
              </div>
              {errors.amount ? (
                <p className="text-xs text-destructive">{errors.amount}</p>
              ) : amount > 0 ? (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatRupiah(amount)}
                </p>
              ) : null}
            </div>

            {/* Kategori / Sumber */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-cat">
                {isIncome ? "Sumber" : "Kategori"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v)
                  if (v !== "Lainnya") setCustomCategory("")
                }}
              >
                <SelectTrigger
                  id="tx-cat"
                  aria-invalid={!!errors.category}
                  className="w-full"
                >
                  <SelectValue
                    placeholder={
                      isIncome
                        ? "Pilih sumber pemasukan"
                        : "Pilih kategori pengeluaran"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {category === "Lainnya" && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Tulis kategori sendiri"
                  maxLength={50}
                  className="mt-2"
                />
              )}
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            {submitError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
                className="sm:w-auto"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={cn(
                  "sm:flex-1",
                  isIncome
                    ? "bg-income hover:bg-income/90 text-income-foreground"
                    : "bg-expense hover:bg-expense/90 text-expense-foreground"
                )}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {submitting ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Hint */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Receipt className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Tips</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nominal disimpan sebagai angka di database, namun ditampilkan
              dalam format Rupiah. Saldo dihitung otomatis dari selisih
              pemasukan dan pengeluaran.
              {onGoToTransactions && (
                <>
                  {" "}
                  Lihat semua catatan di halaman{" "}
                  <button
                    type="button"
                    onClick={onGoToTransactions}
                    className="font-medium text-primary hover:underline"
                  >
                    Transaksi
                  </button>
                  .
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
