"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApiResponse,
  Stats,
  Transaction,
  TransactionType,
} from "@/lib/types";

/**
 * Hook untuk mengambil & memanipulasi data transaksi.
 * Dipusatkan di sini agar dashboard, form, dan list share state yg sama.
 */
export function useBendahara() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, statsRes] = await Promise.all([
        fetch("/api/transactions", { cache: "no-store" }),
        fetch("/api/stats", { cache: "no-store" }),
      ]);
      const txJson: ApiResponse<Transaction[]> = await txRes.json();
      const statsJson: ApiResponse<Stats> = await statsRes.json();

      if (txJson.ok) setTransactions(txJson.data);
      else setError(txJson.error || "Gagal memuat transaksi.");

      if (statsJson.ok) setStats(statsJson.data);
      else if (!statsJson.ok) setError(statsJson.error || "Gagal memuat ringkasan.");
    } catch (e: any) {
      setError("Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Buat transaksi baru. Return { ok, data?, error?, fieldErrors? } */
  const createTransaction = useCallback(
    async (payload: {
      type: TransactionType;
      date: string;
      description: string;
      amount: number;
      category: string;
    }) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ApiResponse<Transaction> = await res.json();
      if (json.ok) {
        await fetchAll();
        return { ok: true as const, data: json.data };
      }
      return {
        ok: false as const,
        error: json.error || "Gagal menyimpan transaksi.",
        fieldErrors: json.fieldErrors,
      };
    },
    [fetchAll]
  );

  /** Update transaksi by id. */
  const updateTransaction = useCallback(
    async (
      id: string,
      payload: {
        type: TransactionType;
        date: string;
        description: string;
        amount: number;
        category: string;
      }
    ) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ApiResponse<Transaction> = await res.json();
      if (json.ok) {
        await fetchAll();
        return { ok: true as const, data: json.data };
      }
      return {
        ok: false as const,
        error: json.error || "Gagal memperbarui transaksi.",
        fieldErrors: json.fieldErrors,
      };
    },
    [fetchAll]
  );

  /** Hapus transaksi by id. */
  const deleteTransaction = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      const json: ApiResponse<null> = await res.json();
      if (json.ok) {
        await fetchAll();
        return { ok: true as const };
      }
      return {
        ok: false as const,
        error: json.error || "Gagal menghapus transaksi.",
      };
    },
    [fetchAll]
  );

  /** Seed data demo (jika tabel kosong). */
  const seedDemo = useCallback(async () => {
    const res = await fetch("/api/seed", { method: "POST" });
    const json: ApiResponse<null> & { message?: string; inserted?: number } =
      await res.json();
    if (json.ok) {
      await fetchAll();
      return {
        ok: true as const,
        message: json.message || "Data demo ditambahkan.",
        inserted: json.inserted ?? 0,
      };
    }
    return { ok: false as const, error: json.error || "Gagal menambah data demo." };
  }, [fetchAll]);

  /** Hapus semua transaksi. */
  const clearAll = useCallback(async () => {
    const res = await fetch("/api/seed", { method: "DELETE" });
    const json: ApiResponse<null> & { message?: string; deleted?: number } =
      await res.json();
    if (json.ok) {
      await fetchAll();
      return {
        ok: true as const,
        message: json.message || "Semua data dihapus.",
        deleted: json.deleted ?? 0,
      };
    }
    return { ok: false as const, error: json.error || "Gagal menghapus data." };
  }, [fetchAll]);

  return {
    transactions,
    stats,
    loading,
    error,
    refresh: fetchAll,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    seedDemo,
    clearAll,
  };
}
