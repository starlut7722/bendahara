import {
  isSupabaseConfigured,
  getSupabase,
} from "@/lib/supabase-server";
import type { Stats, Transaction, TransactionType } from "@/lib/types";

/**
 * === LAPISAN AKSES DATA ===
 *
 * PERBAIKAN PRODUCTION (mencegah 500 di Vercel):
 *  - Production (NODE_ENV=production) WAJIB memakai Supabase. Bila env var
 *    Supabase belum terisi, lempar error jelas — TIDAK jatuh ke Prisma
 *    (Prisma butuh DATABASE_URL yg tidak ada di Vercel, sehingga bikin 500).
 *  - Development (NODE_ENV!=production) tetap fallback ke Prisma+SQLite
 *    lokal agar preview/development nyaman tanpa env Supabase.
 *  - Env var dibaca saat pemanggilan (call-time) via supabase-server,
 *    bukan saat module load, agar selalu segar di serverless.
 *  - Bentuk data yang dikembalikan SELALU sama (tipe `Transaction`/`Stats`),
 *    sehingga API route & frontend tidak perlu berubah.
 *
 * Struktur tabel Supabase `transactions` (sudah Anda buat, tak diubah):
 *   id | date | type | description | amount | category | created_at | updated_at
 */

const TABLE = "transactions";
const VALID_TYPES: TransactionType[] = ["income", "expense"];

/** Tentukan sumber data. Production tanpa Supabase → lempar error jelas. */
function resolveSource(): "supabase" | "prisma" {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase belum dikonfigurasi di production. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada Vercel Environment Variables, lalu redeploy."
    );
  }
  return "prisma";
}

// ---------- Mapper Supabase row -> Transaction (camelCase) ----------
interface SupaRow {
  id: string | number;
  date: string;
  type: string;
  description: string;
  amount: number | string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

function mapRow(row: SupaRow): Transaction {
  return {
    id: String(row.id),
    date: row.date,
    type: row.type as TransactionType,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    createdAt: row.created_at ?? row.date,
    updatedAt: row.updated_at ?? row.created_at ?? row.date,
  };
}

/** Mapper untuk hasil Prisma (Date -> ISO string) agar sesuai tipe Transaction. */
interface PrismaRow {
  id: string;
  date: Date;
  type: string;
  description: string;
  amount: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapPrismaRow(row: PrismaRow): Transaction {
  return {
    id: row.id,
    date: row.date.toISOString(),
    type: row.type as TransactionType,
    description: row.description,
    amount: row.amount,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toISODate(value: string): string {
  // value = yyyy-mm-dd (dari input type=date). Simpan sebagai ISO agar
  // kompatibel dgn kolom `date` maupun `timestamptz` di Postgres.
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toISOString();
}

// =================================================================
//  QUERY: LIST
// =================================================================
export interface ListFilters {
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export async function listTransactions(
  filters: ListFilters
): Promise<Transaction[]> {
  return resolveSource() === "supabase"
    ? listSupabase(filters)
    : listPrisma(filters);
}

async function listSupabase(filters: ListFilters): Promise<Transaction[]> {
  const supa = getSupabase();
  let query = supa.from(TABLE).select("*");

  if (filters.type && VALID_TYPES.includes(filters.type as TransactionType)) {
    query = query.eq("type", filters.type);
  }
  if (filters.search) {
    // PostgREST OR + ilike. Wildcard = %. JANGAN double-encode (supabase-js
    // sudah encode URL). Buang karakter yang bisa memecah sintaks filter.
    const q = filters.search.replace(/[%_,()]/g, " ").trim();
    if (q) {
      query = query.or(
        `description.ilike.%${q}%,category.ilike.%${q}%`
      );
    }
  }
  if (filters.startDate) {
    query = query.gte("date", toISODate(filters.startDate));
  }
  if (filters.endDate) {
    const ed = new Date(filters.endDate);
    if (!isNaN(ed.getTime())) {
      ed.setHours(23, 59, 59, 999);
      query = query.lte("date", ed.toISOString());
    }
  }
  query = query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.limit && Number.isFinite(filters.limit)) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(translateSupabaseError(error));
  return (data as SupaRow[] | null ?? []).map(mapRow);
}

async function listPrisma(filters: ListFilters): Promise<Transaction[]> {
  const { db } = await import("@/lib/db");
  const where: any = {};
  if (filters.type && VALID_TYPES.includes(filters.type as TransactionType)) {
    where.type = filters.type;
  }
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { category: { contains: filters.search } },
    ];
  }
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const ed = new Date(filters.endDate);
      ed.setHours(23, 59, 59, 999);
      where.date.lte = ed;
    }
  }
  const rows = await db.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    ...(filters.limit && Number.isFinite(filters.limit)
      ? { take: filters.limit }
      : {}),
  });
  return rows.map(mapPrismaRow);
}

// =================================================================
//  QUERY: CREATE
// =================================================================
export interface TxInput {
  type: TransactionType;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export async function createTransaction(input: TxInput): Promise<Transaction> {
  return resolveSource() === "supabase"
    ? createSupabase(input)
    : createPrisma(input);
}

async function createSupabase(input: TxInput): Promise<Transaction> {
  const supa = getSupabase();
  const payload = {
    date: toISODate(input.date),
    type: input.type,
    description: input.description,
    amount: input.amount,
    category: input.category,
  };
  const { data, error } = await supa
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(translateSupabaseError(error));
  return mapRow(data as SupaRow);
}

async function createPrisma(input: TxInput): Promise<Transaction> {
  const { db } = await import("@/lib/db");
  const row = await db.transaction.create({
    data: {
      type: input.type,
      date: new Date(input.date),
      description: input.description,
      amount: input.amount,
      category: input.category,
    },
  });
  return mapPrismaRow(row);
}

// =================================================================
//  QUERY: UPDATE
// =================================================================
export async function updateTransaction(
  id: string,
  input: TxInput
): Promise<Transaction> {
  return resolveSource() === "supabase"
    ? updateSupabase(id, input)
    : updatePrisma(id, input);
}

async function updateSupabase(
  id: string,
  input: TxInput
): Promise<Transaction> {
  const supa = getSupabase();
  const payload = {
    date: toISODate(input.date),
    type: input.type,
    description: input.description,
    amount: input.amount,
    category: input.category,
  };
  const { data, error } = await supa
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  if (!data) throw new Error("Transaksi tidak ditemukan.");
  return mapRow(data as SupaRow);
}

async function updatePrisma(
  id: string,
  input: TxInput
): Promise<Transaction> {
  const { db } = await import("@/lib/db");
  const row = await db.transaction.update({
    where: { id },
    data: {
      type: input.type,
      date: new Date(input.date),
      description: input.description,
      amount: input.amount,
      category: input.category,
    },
  });
  return mapPrismaRow(row);
}

// =================================================================
//  QUERY: DELETE
// =================================================================
export async function deleteTransaction(id: string): Promise<void> {
  if (resolveSource() === "supabase") return deleteSupabase(id);
  return deletePrisma(id);
}

async function deleteSupabase(id: string): Promise<void> {
  const supa = getSupabase();
  const { error } = await supa.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(translateSupabaseError(error));
}

async function deletePrisma(id: string): Promise<void> {
  const { db } = await import("@/lib/db");
  await db.transaction.delete({ where: { id } });
}

// =================================================================
//  QUERY: STATS (saldo dihitung dari data transaksi)
// =================================================================
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export async function getStats(range?: DateRange): Promise<Stats> {
  return resolveSource() === "supabase"
    ? statsSupabase(range)
    : statsPrisma(range);
}

async function statsSupabase(range?: DateRange): Promise<Stats> {
  const supa = getSupabase();
  let query = supa.from(TABLE).select("type, amount, date");
  if (range?.startDate) query = query.gte("date", toISODate(range.startDate));
  if (range?.endDate) {
    const ed = new Date(range.endDate);
    if (!isNaN(ed.getTime())) {
      ed.setHours(23, 59, 59, 999);
      query = query.lte("date", ed.toISOString());
    }
  }
  const { data, error } = await query;
  if (error) throw new Error(translateSupabaseError(error));

  const rows = (data ?? []) as Array<{
    type: string;
    amount: number | string;
  }>;
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of rows) {
    const amt = Number(r.amount);
    if (r.type === "income") totalIncome += amt;
    else if (r.type === "expense") totalExpense += amt;
  }
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    count: rows.length,
  };
}

async function statsPrisma(range?: DateRange): Promise<Stats> {
  const { db } = await import("@/lib/db");
  const where: any = {};
  if (range?.startDate || range?.endDate) {
    where.date = {};
    if (range?.startDate) where.date.gte = new Date(range.startDate);
    if (range?.endDate) {
      const ed = new Date(range.endDate);
      ed.setHours(23, 59, 59, 999);
      where.date.lte = ed;
    }
  }
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
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    count: txs.length,
  };
}

// =================================================================
//  QUERY: COUNT
// =================================================================
export async function countTransactions(): Promise<number> {
  return resolveSource() === "supabase" ? countSupabase() : countPrisma();
}

async function countSupabase(): Promise<number> {
  const supa = getSupabase();
  const { count, error } = await supa
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(translateSupabaseError(error));
  return count ?? 0;
}

async function countPrisma(): Promise<number> {
  const { db } = await import("@/lib/db");
  return db.transaction.count();
}

// =================================================================
//  QUERY: SEED DEMO (hanya jika tabel kosong)
// =================================================================
const DEMO_DATA: Array<Omit<TxInput, "date"> & { date: string }> = [
  { date: "2026-10-01", type: "income", description: "Kas OSIS bulanan anggota", amount: 250000, category: "Kas OSIS" },
  { date: "2026-10-03", type: "income", description: "Iuran rutin mingguan", amount: 50000, category: "Iuran Rutin" },
  { date: "2026-10-05", type: "expense", description: "Membeli alat tulis", amount: 45000, category: "ATK" },
  { date: "2026-10-07", type: "expense", description: "Konsumsi rapat OSIS", amount: 30000, category: "Konsumsi" },
  { date: "2026-10-10", type: "income", description: "Sponsor kegiatan OSIS", amount: 200000, category: "Sponsor" },
  { date: "2026-10-12", type: "expense", description: "Cetak materi kegiatan", amount: 25000, category: "ATK" },
  { date: "2026-10-15", type: "expense", description: "Hadiah lomba OSIS", amount: 75000, category: "Kegiatan" },
  { date: "2026-10-18", type: "income", description: "Hasil bazaar OSIS", amount: 120000, category: "Hasil Bazaar" },
];

export async function seedDemo(): Promise<{ inserted: number; message: string }> {
  const count = await countTransactions();
  if (count > 0) {
    return {
      inserted: 0,
      message: "Data sudah ada, tidak perlu menambah data demo.",
    };
  }
  if (resolveSource() === "supabase") {
    const supa = getSupabase();
    const rows = DEMO_DATA.map((d) => ({
      date: toISODate(d.date),
      type: d.type,
      description: d.description,
      amount: d.amount,
      category: d.category,
    }));
    const { error } = await supa.from(TABLE).insert(rows);
    if (error) throw new Error(translateSupabaseError(error));
    return {
      inserted: rows.length,
      message: "Data demo berhasil ditambahkan ke Supabase.",
    };
  }
  const { db } = await import("@/lib/db");
  const result = await db.transaction.createMany({
    data: DEMO_DATA.map((d) => ({
      date: new Date(d.date),
      type: d.type,
      description: d.description,
      amount: d.amount,
      category: d.category,
    })),
  });
  return {
    inserted: result.count,
    message: "Data demo berhasil ditambahkan.",
  };
}

// =================================================================
//  QUERY: CLEAR ALL
// =================================================================
export async function clearAll(): Promise<{ deleted: number; message: string }> {
  return resolveSource() === "supabase" ? clearSupabase() : clearPrisma();
}

async function clearSupabase(): Promise<{ deleted: number; message: string }> {
  const supa = getSupabase();
  // PostgREST wajib filter untuk DELETE. `id` NOT NULL mencakup semua baris.
  const { count, error } = await supa
    .from(TABLE)
    .delete({ count: "exact" })
    .not("id", "is", null);
  if (error) throw new Error(translateSupabaseError(error));
  return {
    deleted: count ?? 0,
    message: "Semua transaksi dihapus dari Supabase.",
  };
}

async function clearPrisma(): Promise<{ deleted: number; message: string }> {
  const { db } = await import("@/lib/db");
  const result = await db.transaction.deleteMany({});
  return {
    deleted: result.count,
    message: "Semua transaksi dihapus.",
  };
}

// =================================================================
//  ERROR TRANSLATION (pesan mudah dipahami utk error Supabase umum)
// =================================================================
function translateSupabaseError(error: {
  code?: string;
  message?: string;
}): string {
  const code = error.code ?? "";
  const msg = error.message ?? "Terjadi kesalahan pada Supabase.";
  if (code === "PGRST116" || /JSON\s*requested/i.test(msg)) {
    return "Data tidak ditemukan di Supabase.";
  }
  if (code === "42501" || /permission denied|jwt|invalid.*token|signature/i.test(msg)) {
    return "Akses ditolak Supabase. Periksa RLS Policy pada tabel 'transactions' (izin select/insert/update/delete untuk anon key) dan pastikan VITE_SUPABASE_ANON_KEY benar.";
  }
  if (code === "42P01" || /relation .* does not exist|Could not find.*table|schema/i.test(msg)) {
    return "Tabel 'transactions' belum ada/kosong di Supabase. Buat tabel dengan kolom: id, date, type, description, amount, category, created_at, updated_at.";
  }
  if (code === "22P02" || /invalid input syntax/i.test(msg)) {
    return "Format data tidak cocok (mis. id bertipe uuid/number). Periksa tipe kolom tabel 'transactions'.";
  }
  if (code === "23505") {
    return "Data duplikat. Transaksi dengan kunci tersebut sudah ada.";
  }
  if (/Failed to fetch|NetworkError|ECONN|fetch failed/i.test(msg)) {
    return "Gagal terhubung ke Supabase. Periksa VITE_SUPABASE_URL dan koneksi jaringan.";
  }
  return `Supabase error${code ? ` (${code})` : ""}: ${msg}`;
}
