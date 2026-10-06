import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/data";

// GET /api/stats
// Menghitung saldo dari data transaksi (tidak disimpan manual).
// Saldo = total pemasukan - total pengeluaran.
// Query opsional: startDate, endDate (untuk laporan periode)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const stats = await getStats({ startDate, endDate });

    return NextResponse.json({ ok: true, data: stats });
  } catch (err: any) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal memuat ringkasan." },
      { status: 500 }
    );
  }
}
