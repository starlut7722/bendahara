// Tipe bersama untuk aplikasi Bendahara

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO string dari DB
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

export type ViewKey =
  | "dashboard"
  | "income"
  | "expense"
  | "transactions"
  | "reports";

export interface ApiError {
  ok: false;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

// Opsi sumber pemasukan OSIS (bisa juga input bebas via "Lainnya")
export const INCOME_SOURCES = [
  "Kas OSIS",
  "Iuran Rutin",
  "Donasi",
  "Hasil Bazaar",
  "Hasil Jualan",
  "Sponsor",
  "Kegiatan",
  "Lainnya",
];

export const EXPENSE_CATEGORIES = [
  "ATK",
  "Konsumsi",
  "Kegiatan",
  "Transportasi",
  "Hadiah",
  "Perlengkapan",
  "Lainnya",
];
