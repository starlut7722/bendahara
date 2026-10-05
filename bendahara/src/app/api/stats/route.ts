import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats
// Menghitung saldo dari data transaksi (tidak disimpan manual).
// Saldo = total pemasukan - total pengeluaran.
// Query opsional: startDate, endDate (untuk laporan periode)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        where.date.lte = ed;
      }
    }

    // Ambil semua transaksi sesuai filter, lalu agregat di JS agar bisa
    // mendapat total income & total expense sekaligus (SQLite聚合 terbatas).
    const txs = await db.transaction.findMany({
      where,
      select: { type: true, amount: true, date: true },
    });

    const totalIncome = txs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const count = txs.length;

    return NextResponse.json({
      ok: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        count,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat ringkasan." },
      { status: 500 }
    );
  }
}
