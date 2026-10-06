import { NextRequest, NextResponse } from "next/server";
import {
  listTransactions,
  createTransaction,
  type TxInput,
} from "@/lib/data";
import { type TransactionType } from "@/lib/types";

const VALID_TYPES: TransactionType[] = ["income", "expense"];

function isString(v: unknown): v is string {
  return typeof v === "string";
}

/**
 * Validasi payload transaksi (create / update).
 * - nominal wajib > 0
 * - keterangan wajib diisi
 * - tanggal wajib diisi & valid
 * - type harus "income" | "expense"
 */
function validatePayload(body: any) {
  const errors: Record<string, string> = {};

  const type = isString(body?.type) ? body.type.trim() : "";
  if (!VALID_TYPES.includes(type as TransactionType)) {
    errors.type = "Jenis transaksi tidak valid.";
  }

  const dateStr = isString(body?.date) ? body.date.trim() : "";
  if (!dateStr) {
    errors.date = "Tanggal wajib diisi.";
  } else {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      errors.date = "Tanggal tidak valid.";
    }
  }

  const description = isString(body?.description)
    ? body.description.trim()
    : "";
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
          type: type as TransactionType,
          date: dateStr,
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
    const search = searchParams.get("search")?.trim() || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const transactions = await listTransactions({
      type: type && VALID_TYPES.includes(type as TransactionType) ? type : undefined,
      search,
      startDate,
      endDate,
      limit,
    });

    return NextResponse.json({ ok: true, data: transactions });
  } catch (err: any) {
    console.error("[GET /api/transactions]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal memuat data transaksi." },
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

    const input: TxInput = result.data;
    const created = await createTransaction(input);

    return NextResponse.json({ ok: true, data: created });
  } catch (err: any) {
    console.error("[POST /api/transactions]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Gagal menyimpan transaksi." },
      { status: 500 }
    );
  }
}
