import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Tipe transaksi yang valid
const VALID_TYPES = ["income", "expense"] as const;
type TxType = (typeof VALID_TYPES)[number];

function isString(v: unknown): v is string {
  return typeof v === "string";
}

/**
 * Validasi payload transaksi (create / update).
 * - nominal wajib > 0
 * - keterangan wajib diisi
 * - tanggal wajib diisi & valid
 * - type harus "income" | "expense"
 * Mengembalikan { ok, data?, error? }
 */
function validatePayload(body: any) {
  const errors: Record<string, string> = {};

  // type
  const type = isString(body?.type) ? body.type.trim() : "";
  if (!VALID_TYPES.includes(type as TxType)) {
    errors.type = "Jenis transaksi tidak valid.";
  }

  // date
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

  // description
  const description = isString(body?.description) ? body.description.trim() : "";
  if (!description) {
    errors.description = "Keterangan wajib diisi.";
  } else if (description.length > 200) {
    errors.description = "Keterangan maksimal 200 karakter.";
  }

  // amount
  let amount = NaN;
  if (body?.amount === undefined || body?.amount === null || body?.amount === "") {
    errors.amount = "Nominal wajib diisi.";
  } else {
    amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = "Nominal harus lebih dari 0.";
    }
  }

  // category (boleh kosong, default "Lainnya")
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

// GET /api/transactions
// Query: type, search, startDate, endDate, limit
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // income | expense
    const search = searchParams.get("search")?.trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const where: any = {};
    if (type && VALID_TYPES.includes(type as TxType)) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        where.date.lte = ed;
      }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...(limit && Number.isFinite(limit) ? { take: limit } : {}),
    });

    return NextResponse.json({ ok: true, data: transactions });
  } catch (err: any) {
    console.error("[GET /api/transactions]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat data transaksi." },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  try {
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

    const created = await db.transaction.create({
      data: result.data,
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    console.error("[POST /api/transactions]", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan transaksi." },
      { status: 500 }
    );
  }
}
