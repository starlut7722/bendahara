import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Data demo - mudah dihapus, tidak mengganggu data asli karena
// ditandai dengan flag isDemo = true di category prefix "[DEMO]".
// Seed hanya mengisi jika tabel masih kosong.
const DEMO_DATA: Array<{
  date: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
}> = [
  {
    date: "2026-10-01",
    type: "income",
    description: "Uang kas bulanan kelas",
    amount: 250000,
    category: "Kas kelas",
  },
  {
    date: "2026-10-03",
    type: "income",
    description: "Iuran mingguan wajib",
    amount: 50000,
    category: "Iuran kelas",
  },
  {
    date: "2026-10-05",
    type: "expense",
    description: "Membeli alat tulis",
    amount: 45000,
    category: "ATK",
  },
  {
    date: "2026-10-07",
    type: "expense",
    description: "Konsumsi rapat kelas",
    amount: 30000,
    category: "Konsumsi",
  },
  {
    date: "2026-10-10",
    type: "income",
    description: "Donasi sponsor kegiatan",
    amount: 200000,
    category: "Donasi",
  },
  {
    date: "2026-10-12",
    type: "expense",
    description: "Cetak materi kegiatan",
    amount: 25000,
    category: "ATK",
  },
  {
    date: "2026-10-15",
    type: "expense",
    description: "Hadiah lomba kelas",
    amount: 75000,
    category: "Kegiatan",
  },
  {
    date: "2026-10-18",
    type: "income",
    description: "Penjualan hasil bazaar",
    amount: 120000,
    category: "Donasi",
  },
];

// POST /api/seed - tambahkan data demo (hanya jika tabel kosong)
export async function POST(_req: NextRequest) {
  try {
    const count = await db.transaction.count();
    if (count > 0) {
      return NextResponse.json({
        ok: true,
        message: "Data sudah ada, tidak perlu menambah data demo.",
        inserted: 0,
      });
    }

    const created = await db.transaction.createMany({
      data: DEMO_DATA.map((d) => ({
        date: new Date(d.date),
        type: d.type,
        description: d.description,
        amount: d.amount,
        category: d.category,
      })),
    });

    return NextResponse.json({
      ok: true,
      message: "Data demo berhasil ditambahkan.",
      inserted: created.count,
    });
  } catch (err: any) {
    console.error("[POST /api/seed]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menambahkan data demo." },
      { status: 500 }
    );
  }
}

// DELETE /api/seed - hapus SEMUA transaksi (reset penuh)
export async function DELETE(_req: NextRequest) {
  try {
    const result = await db.transaction.deleteMany({});
    return NextResponse.json({
      ok: true,
      message: "Semua transaksi dihapus.",
      deleted: result.count,
    });
  } catch (err: any) {
    console.error("[DELETE /api/seed]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menghapus data." },
      { status: 500 }
    );
  }
}
