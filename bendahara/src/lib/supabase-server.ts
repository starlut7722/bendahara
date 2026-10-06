import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * === KONEKSI SUPABASE (SERVER-SIDE) ===
 *
 * INGAT: proyek ini Next.js (bukan Vite). `import.meta.env.VITE_*` adalah
 * sintaks Vite dan TIDAK berfungsi di Next.js. Di Next.js, env var dibaca
 * via `process.env`. Karena seluruh akses data berjalan di API route
 * (server-side), `process.env` sudah benar dan aman.
 *
 * PERBAIKAN PRODUCTION (Vercel 500):
 *  - Env var kini dibaca SAAT DIPANGGIL (call-time), bukan saat module load.
 *    Ini menghindari masalah timing/inlining di lingkungan serverless Vercel.
 *  - Dukung beberapa ALIAS nama variabel agar kompatibel apa pun yang Anda
 *    set di Vercel. Urutan pengecekan:
 *      URL  : VITE_SUPABASE_URL      -> NEXT_PUBLIC_SUPABASE_URL -> SUPABASE_URL
 *      KEY  : VITE_SUPABASE_ANON_KEY -> NEXT_PUBLIC_SUPABASE_ANON_KEY -> SUPABASE_ANON_KEY -> SUPABASE_KEY
 *    Nama `VITE_*` tetap didukung penuh (utama).
 *
 * KEAMANAN:
 *  - Hanya URL + anon/publishable key (aman untuk publik).
 *  - TIDAK PERNAH memakai service-role key / `sb_secret_...` di mana pun.
 */

// Kandidat nama env var (dipeksa berurutan; ambil yg pertama terisi).
const URL_VARS = [
  "VITE_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
] as const;

const KEY_VARS = [
  "VITE_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_KEY",
] as const;

/** Baca nilai env var pertama yang terisi (dari daftar alias). */
function readEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const raw = process.env[name];
    if (typeof raw === "string" && raw.trim() !== "") {
      return raw.trim();
    }
  }
  return undefined;
}

/** URL Supabase yang aktif (dibaca saat pemanggilan). */
export function getSupabaseUrl(): string | undefined {
  return readEnv(URL_VARS);
}

/** Anon/publishable key Supabase yang aktif. */
export function getSupabaseAnonKey(): string | undefined {
  return readEnv(KEY_VARS);
}

/** Nama env var yang benar-benar terpakai (untuk diagnostik, tanpa nilai). */
export function getSupabaseConfigSource(): {
  urlVar: string | null;
  keyVar: string | null;
} {
  let urlVar: string | null = null;
  let keyVar: string | null = null;
  for (const n of URL_VARS) {
    const v = process.env[n];
    if (typeof v === "string" && v.trim() !== "") {
      urlVar = n;
      break;
    }
  }
  for (const n of KEY_VARS) {
    const v = process.env[n];
    if (typeof v === "string" && v.trim() !== "") {
      keyVar = n;
      break;
    }
  }
  return { urlVar, keyVar };
}

/** Apakah Supabase sudah dikonfigurasi (URL + anon key terisi)? */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

// Cache client per proses serverless. Karena nilai dibaca ulang tiap
// pemanggilan, kita hanya membuat client baru bila env berubah.
let cached: { url: string; key: string; client: SupabaseClient } | null = null;

/**
 * Ambil client Supabase (memakai URL + anon key).
 * Melempar error yang jelas bila env var belum diset.
 */
export function getSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada Environment Variables (Vercel) lalu redeploy."
    );
  }
  if (!cached || cached.url !== url || cached.key !== key) {
    cached = {
      url,
      key,
      client: createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  }
  return cached.client;
}
