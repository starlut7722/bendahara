"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Calendar,
  Download,
  FileBarChart,
  Printer,
  TrendingDown,
  TrendingUp,
  Wallet,
  Receipt,
} from "lucide-react";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  format,
  isWithinInterval,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  downloadFile,
  formatRupiah,
  formatTanggal,
  formatTanggalPendek,
  transactionsToCSV,
  typeLabel,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { StatCard } from "./stat-card";

type PeriodKey = "today" | "week" | "month" | "year" | "custom";

interface PeriodOption {
  key: PeriodKey;
  label: string;
  short: string;
}

const PERIODS: PeriodOption[] = [
  { key: "today", label: "Hari Ini", short: "Hari" },
  { key: "week", label: "Minggu Ini", short: "Minggu" },
  { key: "month", label: "Bulan Ini", short: "Bulan" },
  { key: "year", label: "Tahun Ini", short: "Tahun" },
  { key: "custom", label: "Custom Tanggal", short: "Custom" },
];

interface ReportsProps {
  transactions: Transaction[];
  loading: boolean;
}

export function Reports({ transactions, loading }: ReportsProps) {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { range, rangeLabel } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, label: string;
    switch (period) {
      case "today":
        start = startOfDay(now);
        end = endOfDay(now);
        label = format(now, "dd MMMM yyyy", { locale: idLocale });
        break;
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1, locale: idLocale });
        end = endOfWeek(now, { weekStartsOn: 1, locale: idLocale });
        label = `${format(start, "dd MMM", { locale: idLocale })} – ${format(
          end,
          "dd MMM yyyy",
          { locale: idLocale }
        )}`;
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        label = format(now, "yyyy", { locale: idLocale });
        break;
      case "custom": {
        if (customStart && customEnd) {
          start = startOfDay(new Date(customStart));
          end = endOfDay(new Date(customEnd));
          label = `${format(start, "dd MMM yyyy", { locale: idLocale })} – ${format(
            end,
            "dd MMM yyyy",
            { locale: idLocale }
          )}`;
        } else {
          // belum dipilih tanggal -> tampilkan semua
          start = new Date(0);
          end = new Date(8640000000000000);
          label = "Semua tanggal";
        }
        break;
      }
      case "month":
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        label = format(now, "MMMM yyyy", { locale: idLocale });
        break;
    }
    return { range: { start, end }, rangeLabel: label };
  }, [period, customStart, customEnd]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return isWithinInterval(d, { start: range.start, end: range.end });
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, range]);

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Data chart: agregasi per-hari/per-bulan sesuai range
  const chartData = useMemo(() => buildChart(filtered, range, period), [filtered, range, period]);

  function handleDownload() {
    if (filtered.length === 0) return;
    const csv = transactionsToCSV(filtered);
    const filename = `laporan-kas-osis-${format(range.start, "yyyyMMdd", {
      locale: idLocale,
    })}-${format(range.end, "yyyyMMdd", { locale: idLocale })}.csv`;
    downloadFile(filename, csv);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="animate-fade-in-up space-y-4 print-area">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Laporan Kas OSIS Adikara Darmalaksana
          </h1>
          <p className="text-sm text-muted-foreground">
            Periode: <span className="font-medium text-foreground">{rangeLabel}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" /> CSV
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={filtered.length === 0}
          >
            <Printer className="size-4" /> Cetak
          </Button>
        </div>
      </div>

      {/* Filter periode */}
      <Card className="no-print">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={period === p.key ? "default" : "outline"}
                onClick={() => setPeriod(p.key)}
                className={period === p.key ? "" : "text-muted-foreground"}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {period === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  aria-label="Tanggal mulai"
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  aria-label="Tanggal akhir"
                  className="pl-9"
                  min={customStart || undefined}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Pemasukan"
          value={loading ? null : totalIncome}
          icon={TrendingUp}
          tone="income"
        />
        <StatCard
          title="Total Pengeluaran"
          value={loading ? null : totalExpense}
          icon={TrendingDown}
          tone="expense"
        />
        <StatCard
          title="Saldo Akhir"
          value={loading ? null : balance}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          title="Jumlah Transaksi"
          value={loading ? null : filtered.length}
          icon={Receipt}
          tone="primary"
          isCurrency={false}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Grafik */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Grafik Pemasukan vs Pengeluaran Kas OSIS</h2>
              <p className="text-xs text-muted-foreground">
                Per {period === "year" ? "bulan" : "hari"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-income" /> Pemasukan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-expense" /> Pengeluaran
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
              <FileBarChart className="size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Tidak ada data untuk periode ini</p>
              <p className="text-xs text-muted-foreground">
                Pilih periode lain atau tambah transaksi.
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
                      if (v >= 1_000) return `${Math.round(v / 1_000)}rb`
                      return String(v)
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(v) => <span style={{ color: "var(--foreground)" }}>{v}</span>}
                  />
                  <Bar dataKey="income" name="Pemasukan" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabel rinci laporan (untuk cetak juga) */}
      <Card className="print-area">
        <CardContent className="p-0">
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Rincian Transaksi</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} transaksi pada periode ini
              </p>
            </div>
          </div>
          <div className="overflow-x-auto scroll-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/40 text-left">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Tanggal</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Jenis</th>
                  <th className="px-4 py-2.5 font-medium">Keterangan</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Kategori</th>
                  <th className="px-4 py-2.5 font-medium text-right whitespace-nowrap">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      Tidak ada transaksi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const isIncome = t.type === "income";
                    return (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {formatTanggalPendek(t.date)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              isIncome
                                ? "bg-income-soft text-income"
                                : "bg-expense-soft text-expense"
                            )}
                          >
                            {typeLabel(t.type)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 max-w-[260px] truncate">{t.description}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                          {t.category}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap",
                            isIncome ? "text-income" : "text-expense"
                          )}
                        >
                          {isIncome ? "+" : "−"}
                          {formatRupiah(t.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 font-semibold bg-muted/30">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Total Pemasukan:
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-income">
                      {formatRupiah(totalIncome)}
                    </td>
                  </tr>
                  <tr className="bg-muted/30 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Total Pengeluaran:
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-expense">
                      {formatRupiah(totalExpense)}
                    </td>
                  </tr>
                  <tr className="bg-muted/40 font-bold">
                    <td colSpan={4} className="px-4 py-3 text-right">
                      Saldo:
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        balance < 0 ? "text-expense" : "text-primary"
                      )}
                    >
                      {formatRupiah(balance)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer cetak (judul laporan) - hanya tampil saat print */}
      <div className="hidden print:block text-center text-xs text-muted-foreground mt-4">
        Laporan dicetak pada {formatTanggal(new Date())} — Kas OSIS Adikara Darmalaksana
      </div>
    </div>
  );
}

interface ChartDatum {
  label: string;
  income: number;
  expense: number;
}

/** Bangun data chart per-hari (untuk today/week/month/custom) atau per-bulan (untuk year). */
function buildChart(
  filtered: Transaction[],
  range: { start: Date; end: Date },
  period: PeriodKey
): ChartDatum[] {
  if (period === "year") {
    // agregasi per bulan
    const months: ChartDatum[] = []
    for (let m = 0; m < 12; m++) {
      months.push({
        label: format(new Date(range.start.getFullYear(), m, 1), "MMM", {
          locale: idLocale,
        }),
        income: 0,
        expense: 0,
      })
    }
    for (const t of filtered) {
      const d = new Date(t.date)
      if (d.getFullYear() === range.start.getFullYear()) {
        const idx = d.getMonth()
        if (t.type === "income") months[idx].income += t.amount
        else months[idx].expense += t.amount
      }
    }
    return months
  }

  // agregasi per hari selama range
  const days: ChartDatum[] = []
  const cursor = startOfDay(range.start)
  const last = endOfDay(range.end)
  // batasi maks 31 hari agar chart tetap terbaca
  let safety = 0
  while (cursor <= last && safety < 62) {
    days.push({
      label: format(cursor, "dd/MM", { locale: idLocale }),
      income: 0,
      expense: 0,
    })
    cursor.setDate(cursor.getDate() + 1)
    safety++
  }
  for (const t of filtered) {
    const d = new Date(t.date)
    const idx = Math.floor(
      (startOfDay(d).getTime() - startOfDay(range.start).getTime()) /
        (24 * 60 * 60 * 1000)
    )
    if (idx >= 0 && idx < days.length) {
      if (t.type === "income") days[idx].income += t.amount
      else days[idx].expense += t.amount
    }
  }
  return days
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <div className="font-medium mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: p.color }}
            />
            {p.name}
          </span>
          <span className="tabular-nums font-medium">{formatRupiah(p.value)}</span>
        </div>
      ))}
    </div>
  )
}
