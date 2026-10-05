"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  formatRupiahInput,
  parseRupiahInput,
  toDateInputValue,
} from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  type Transaction,
  type TransactionType,
} from "@/lib/types";

export interface TransactionFormValues {
  type: TransactionType;
  date: string; // yyyy-mm-dd
  description: string;
  amount: number;
  category: string;
}

type SubmitResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** mode: tipe transaksi default saat menambah baru */
  type: TransactionType;
  /** jika ada = mode edit */
  initial?: Transaction | null;
  onSubmit: (values: TransactionFormValues) => Promise<SubmitResult>;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  type,
  initial,
  onSubmit,
}: TransactionFormDialogProps) {
  const isEdit = !!initial;
  const isIncome = type === "income";
  const title = isEdit
    ? isIncome
      ? "Edit Pemasukan"
      : "Edit Pengeluaran"
    : isIncome
      ? "Tambah Pemasukan"
      : "Tambah Pengeluaran";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto scroll-soft">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIncome ? (
              <ArrowDownCircle className="size-5 text-income" />
            ) : (
              <ArrowUpCircle className="size-5 text-expense" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data di bawah lalu simpan. Saldo akan diperbarui otomatis.
          </DialogDescription>
        </DialogHeader>
        {/* key memastikan form di-reset fresh setiap dialog dibuka / ganti mode */}
        <FormBody
          key={isEdit ? initial!.id : `new-${type}`}
          type={type}
          initial={initial ?? null}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface FormBodyProps {
  type: TransactionType;
  initial: Transaction | null;
  onSubmit: (values: TransactionFormValues) => Promise<SubmitResult>;
  onCancel: () => void;
}

function FormBody({ type, initial, onSubmit, onCancel }: FormBodyProps) {
  const isIncome = type === "income";
  const options = isIncome ? INCOME_SOURCES : EXPENSE_CATEGORIES;

  // Inisialisasi sekali saat mount. Karena dialog remount saat dibuka,
  // nilai selalu fresh tanpa perlu useEffect sink.
  const [date, setDate] = useState(() =>
    initial ? toDateInputValue(initial.date) : toDateInputValue(new Date())
  );
  const [description, setDescription] = useState(() => initial?.description ?? "");
  const [amountRaw, setAmountRaw] = useState(() =>
    initial && initial.amount > 0
      ? new Intl.NumberFormat("id-ID").format(initial.amount)
      : ""
  );
  const isInOptions = initial
    ? options.includes(initial.category as never)
    : false;
  const [category, setCategory] = useState(() =>
    initial ? (isInOptions ? initial.category : "Lainnya") : ""
  );
  const [customCategory, setCustomCategory] = useState(() =>
    initial && !isInOptions ? initial.category : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const amount = useMemo(() => parseRupiahInput(amountRaw), [amountRaw]);

  function resolveCategory(): string {
    if (category === "Lainnya" || (category === "" && customCategory.trim())) {
      return customCategory.trim();
    }
    return category;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!date) e.date = "Tanggal wajib diisi.";
    else {
      const d = new Date(date);
      if (isNaN(d.getTime())) e.date = "Tanggal tidak valid.";
    }
    if (!description.trim()) e.description = "Keterangan wajib diisi.";
    else if (description.trim().length > 200)
      e.description = "Keterangan maksimal 200 karakter.";
    if (!amount || amount <= 0) e.amount = "Nominal harus lebih dari 0.";
    if (!resolveCategory()) e.category = "Kategori wajib dipilih.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = await onSubmit({
      type,
      date,
      description: description.trim(),
      amount,
      category: resolveCategory(),
    });
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error || "Terjadi kesalahan.");
      if (result.fieldErrors) setErrors(result.fieldErrors);
    } else {
      // sukses: tutup dialog
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1" noValidate>
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
            isIncome ? "cth: Uang kas bulanan" : "cth: Membeli alat tulis"
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
            onChange={(e) => setAmountRaw(formatRupiahInput(e.target.value))}
            placeholder="0"
            className="pl-9 tabular-nums"
            aria-invalid={!!errors.amount}
          />
        </div>
        {errors.amount ? (
          <p className="text-xs text-destructive">{errors.amount}</p>
        ) : amount > 0 ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(amount)}
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
            setCategory(v);
            if (v !== "Lainnya") setCustomCategory("");
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

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className={cn(
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
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
