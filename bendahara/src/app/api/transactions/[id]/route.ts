import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_TYPES = ["income", "expense"] as const;
type TxType = (typeof VALID_TYPES)[number];

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function validatePayload(body: any) {
  const errors: Record<string, string> = {};

  const type = isString(body?.type) ? body.type.trim() : "";
  if (!VALID_TYPES.includes(type as TxType)) {
    errors.type = "Jenis transaksi tidak valid.";
  }

  const dateStr = isString(body?.date) ? body.date.trim() : "";
  let dateObj: Date | null = null;
  if (!dateStr) {
    errors.date = "Tanggal wajib diisi.";
  } else {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      errors.date = "Tanggal tidak valid.";
    } else {
      dateObj = parsed;
    }
  }

  const description = isString(body?.description) ? body.description.trim() : "";
  if (!description) {
    errors.description = "Keterangan wajib diisi.";
  } else if (description.length > 200) {
    errors.description = "Keterangan maksimal 200 karakter.";
  }

  let amount = NaN;
  if (body?.amount === undefined || body?.amount === null || body?.amount === "") {
    errors.amount = "Nominal wajib diisi.";
  } else {
    amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = "Nominal harus lebih dari 0.";
    }
  }

  const category = isString(body?.category) ? body.category.trim() : "";

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    data: ok
      ? {
          type: type as TxType,
          date: dateObj as Date,
          description,
          amount: Math.round(amount),
          category: category || "Lainnya",
        }
      : null,
  };
}

// PUT /api/transactions/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Data tidak valid." },
        { status: 400 }
      );
    }

    const result = validatePayload(body);
    if (!result.ok || !result.data) {
      return NextResponse.json(
        { ok: false, error: "Validasi gagal.", fieldErrors: result.errors },
        { status: 400 }
      );
    }

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await db.transaction.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("[PUT /api/transactions/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memperbarui transaksi." },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.transaction.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/transactions/[id]]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}
