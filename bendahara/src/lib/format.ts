// Utilitas format untuk aplikasi Bendahara

/**
 * Format angka ke format Rupiah, contoh: 50000 -> "Rp50.000"
 * Database tetap menyimpan angka, UI yang memformat.
 */
export function formatRupiah(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0
  return "Rp" + new Intl.NumberFormat("id-ID").format(value)
}

/**
 * Format angka ke Rupiah tanpa prefix "Rp", contoh: 50000 -> "50.000"
 */
export function formatNumber(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0
  return new Intl.NumberFormat("id-ID").format(value)
}

/**
 * Parse input string Rupiah dari user menjadi angka.
 * Misal "50.000" atau "Rp50.000" -> 50000.
 * Menghapus semua karakter non-digit.
 */
export function parseRupiahInput(value: string): number {
  const digits = (value || "").replace(/[^\d]/g, "")
  if (digits === "") return 0
  const num = parseInt(digits, 10)
  return Number.isFinite(num) ? num : 0
}

/**
 * Format input nominal saat user mengetik, contoh: 50000 -> "50.000"
 * Digunakan untuk controlled input di form.
 */
export function formatRupiahInput(value: string): string {
  const num = parseRupiahInput(value)
  if (num === 0) return ""
  return new Intl.NumberFormat("id-ID").format(num)
}

/**
 * Format tanggal ke format Indonesia, contoh: "5 Oktober 2026"
 */
export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

/**
 * Format tanggal pendek, contoh: "05 Okt 2026"
 */
export function formatTanggalPendek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

/**
 * Format tanggal + waktu, contoh: "05/10/2026, 14.30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/**
 * Konversi Date ke string yyyy-mm-dd untuk input type="date"
 */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Label jenis transaksi
 */
export function typeLabel(type: string): string {
  return type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : type
}

/**
 * Escape nilai untuk CSV (tangani koma, kutip, newline).
 */
function csvEscape(value: string | number): string {
  const s = String(value ?? "")
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Buat konten CSV dari daftar transaksi.
 * Format bisa dibuka Excel/Google Sheets.
 * Pakai BOM agar Excel mengenali UTF-8.
 */
export function transactionsToCSV(
  rows: Array<{
    date: string | Date
    type: string
    description: string
    amount: number
    category: string
  }>
): string {
  const header = ["Tanggal", "Jenis", "Keterangan", "Kategori/Sumber", "Nominal"]
  const lines = rows.map((r) => {
    const d = typeof r.date === "string" ? new Date(r.date) : r.date
    const dateStr = isNaN(d.getTime())
      ? ""
      : new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d)
    const type = r.type === "income" ? "Pemasukan" : "Pengeluaran"
    return [
      csvEscape(dateStr),
      csvEscape(type),
      csvEscape(r.description),
      csvEscape(r.category),
      csvEscape(r.amount),
    ].join(",")
  })
  return [header.join(","), ...lines].join("\r\n")
}

/**
 * Trigger download file di browser.
 */
export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
