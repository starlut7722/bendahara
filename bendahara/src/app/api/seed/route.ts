import { NextRequest, NextResponse } from "next/server";
import { seedDemo, clearAll } from "@/lib/data";

// POST /api/seed - tambahkan data demo (hanya jika tabel kosong).
// Data demo mudah dihapus dan tidak mengganggu data asli.
export async function POST(_req: NextRequest) {
  try {
    const result = await seedDemo();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[POST /api/seed]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal menambahkan data demo." },
      { status: 500 }
    );
  }
}

// DELETE /api/seed - hapus SEMUA transaksi (reset penuh)
export async function DELETE(_req: NextRequest) {
  try {
    const result = await clearAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[DELETE /api/seed]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal menghapus data." },
      { status: 500 }
    );
  }
}
