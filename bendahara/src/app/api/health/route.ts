import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  getSupabaseUrl,
  getSupabaseConfigSource,
} from "@/lib/supabase-server";

/**
 * GET /api/health
 *
 * Endpoint diagnostik untuk memastikan koneksi Supabase terbaca di
 * server (Vercel) TANPA membocorkan nilai rahasia. Hanya menampilkan
 * status + nama env var yg terpakai + host (publik) + prefix key.
 *
 * Cocok untuk debugging error 500 di Vercel: panggil di browser ke
 * https://<domain-vercel>/api/health dan lihat outputnya.
 */
export async function GET() {
  const url = getSupabaseUrl();
  const { urlVar, keyVar } = getSupabaseConfigSource();
  const configured = isSupabaseConfigured();

  // Tampilkan host Supabase (publik, bukan rahasia) dan prefix anon key
  // untuk memastikan env var terbaca tanpa membocorkan nilai penuh.
  let host: string | null = null;
  if (url) {
    try {
      host = new URL(url).host;
    } catch {
      host = "(URL tidak valid)";
    }
  }
  const keyPrefix = process.env[keyVar ?? ""]?.slice(0, 12) ?? null;

  return NextResponse.json({
    ok: true,
    data: {
      supabaseConfigured: configured,
      dataSource: configured
        ? "supabase"
        : process.env.NODE_ENV === "production"
          ? "error-production-missing-env"
          : "prisma-local-fallback",
      urlEnvVar: urlVar,
      keyEnvVar: keyVar,
      supabaseHost: host,
      anonKeyPrefix: keyPrefix ? `${keyPrefix}…` : null,
      nodeEnv: process.env.NODE_ENV ?? null,
      timestamp: new Date().toISOString(),
    },
    hint: configured
      ? "Supabase terbaca. Jika API tetap 500, kemungkinan masalah RLS Policy atau tabel 'transactions'."
      : "Env var Supabase belum terbaca server. Tambahkan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di Vercel → Settings → Environment Variables, lalu redeploy.",
  });
}
