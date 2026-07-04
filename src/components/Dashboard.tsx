import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Droplet,
  CloudRain,
  Clock,
  Wrench,
  Percent,
  Sparkles,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  TrendingUp as TrendUpIcon,
  HelpCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardProps {
  filters: {
    jobsite: string;
    month: string;
    year: string;
    startDate: string;
    endDate: string;
  };
}

export default function Dashboard({ filters }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
        <p>Gagal memuat dashboard: {error || "Data tidak tersedia"}</p>
      </div>
    );
  }

  const k = metrics.kpis;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const getAchievementColor = (ach: number) => {
    if (ach >= 100) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/10";
    if (ach >= 85) return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/10";
    if (ach >= 70) return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/10";
    return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/10";
  };

  const getAlertBanner = () => {
    const alerts: string[] = [];
    if (k.profitMargin < 0) {
      alerts.push("Warning: Margin profit bernilai negatif!");
    }
    if (k.fuelRatioOB > 0.5) {
      alerts.push("Warning: Fuel Ratio Overburden melebihi target optimal (0.5 L/BCM)!");
    }
    if (k.achOB < 80 && k.targetOB > 0) {
      alerts.push(`Produksi Overburden di bawah target (${k.achOB.toFixed(1)}% pencapaian)!`);
    }
    if (k.budgetRemaining < 0) {
      alerts.push("Alert: Anggaran pengeluaran (Operating Budget) telah terlewati (Over Budget)!");
    } else if (k.budgetRemaining < k.totalCost * 0.1) {
      alerts.push("Warning: Sisa anggaran operasional kurang dari 10%!");
    }

    if (alerts.length === 0) return null;

    return (
      <div className="space-y-2 rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          <span>Notifikasi & Peringatan Sistem</span>
        </div>
        <ul className="list-disc pl-5 text-sm text-amber-700 dark:text-amber-300">
          {alerts.map((al, idx) => (
            <li key={idx}>{al}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {getAlertBanner()}

      {/* 1. Production KPIs */}
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Produksi & Cuaca</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* OB CARD */}
          <div
            onClick={() => setSelectedKpi("OB")}
            className="group relative overflow-hidden rounded-xl border-l-4 border-l-blue-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overburden (OB)</p>
                <h3 className="mt-1 text-2xl font-black text-slate-800 dark:text-zinc-100">{k.actualOB.toLocaleString("id-ID", { maximumFractionDigits: 0 })} <span className="text-sm font-semibold text-slate-400">BCM</span></h3>
                <p className="text-xs text-slate-500 mt-1">Target: {k.targetOB.toLocaleString("id-ID", { maximumFractionDigits: 0 })} BCM</p>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getAchievementColor(k.achOB)}`}>
                {k.achOB.toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <span>Pencapaian Volume OB</span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* COAL CARD */}
          <div
            onClick={() => setSelectedKpi("COAL")}
            className="group relative overflow-hidden rounded-xl border-l-4 border-l-amber-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coal Production</p>
                <h3 className="mt-1 text-2xl font-black text-slate-800 dark:text-zinc-100">{k.actualCoal.toLocaleString("id-ID", { maximumFractionDigits: 0 })} <span className="text-sm font-semibold text-slate-400">Ton</span></h3>
                <p className="text-xs text-slate-500 mt-1">Target: {k.targetCoal.toLocaleString("id-ID", { maximumFractionDigits: 0 })} Ton</p>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getAchievementColor(k.achCoal)}`}>
                {k.achCoal.toFixed(1)}%
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <span>Pencapaian Volume Coal</span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* RAIN CARD */}
          <div
            onClick={() => setSelectedKpi("RAIN")}
            className="group relative overflow-hidden rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curah Hujan (Rain)</p>
                <h3 className="mt-1 text-2xl font-black text-slate-800 dark:text-zinc-100">{k.actualRain.toFixed(1)} <span className="text-sm font-semibold text-slate-400">Hrs</span></h3>
                <p className="text-xs text-slate-500 mt-1">Target Maks: {k.targetRain.toFixed(1)} Hrs</p>
              </div>
              <span className={`rounded-lg p-2 text-xs font-bold ${k.actualRain <= k.targetRain ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/10" : "text-red-600 bg-red-50"}`}>
                <CloudRain className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Jam Terhenti Akibat Hujan</span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* SLIPPERY CARD */}
          <div
            onClick={() => setSelectedKpi("SLIPPERY")}
            className="group relative overflow-hidden rounded-xl border-l-4 border-l-rose-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slippery Hours</p>
                <h3 className="mt-1 text-2xl font-black text-slate-800 dark:text-zinc-100">{k.actualSlippery.toFixed(1)} <span className="text-sm font-semibold text-slate-400">Hrs</span></h3>
                <p className="text-xs text-slate-500 mt-1">Target Maks: {k.targetSlippery.toFixed(1)} Hrs</p>
              </div>
              <span className={`rounded-lg p-2 text-xs font-bold ${k.actualSlippery <= k.targetSlippery ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold">
              <span>Jam Kerja Terhenti Licin</span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fuel & Equipment Productivities */}
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Konsumsi Bahan Bakar & Efisiensi Alat</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border-l-4 border-l-orange-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/10 dark:text-orange-400">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Ratio OB</p>
                <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">{k.fuelRatioOB.toFixed(2)} <span className="text-xs font-normal text-slate-400">L/BCM</span></h4>
              </div>
            </div>
          </div>
          <div className="rounded-xl border-l-4 border-l-yellow-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600 dark:bg-yellow-950/10 dark:text-yellow-400">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Ratio Coal</p>
                <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">{k.fuelRatioCoal.toFixed(2)} <span className="text-xs font-normal text-slate-400">L/Ton</span></h4>
              </div>
            </div>
          </div>
          <div className="rounded-xl border-l-4 border-l-indigo-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/10 dark:text-indigo-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productivity OB</p>
                <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">{k.productivityOB.toFixed(1)} <span className="text-xs font-normal text-slate-400">BCM/EWH</span></h4>
              </div>
            </div>
          </div>
          <div className="rounded-xl border-l-4 border-l-purple-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/10 dark:text-purple-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productivity Coal</p>
                <h4 className="text-lg font-black text-slate-800 dark:text-zinc-100">{k.productivityCoal.toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton/EWH</span></h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Financial KPIs */}
      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Dashboard Keuangan & Cost Control</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* NET REVENUE */}
          <div className="rounded-xl border-l-4 border-l-emerald-600 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue (Net)</p>
            <h3 className="mt-1 text-xl font-black text-slate-800 dark:text-zinc-100">Rp {k.totalRevenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</h3>
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1 block">Realisasi Penerimaan Tambang</span>
          </div>

          {/* TOTAL COST */}
          <div className="rounded-xl border-l-4 border-l-rose-600 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Operating Cost</p>
            <h3 className="mt-1 text-xl font-black text-slate-800 dark:text-zinc-100">Rp {k.totalCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</h3>
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1 block">Pengeluaran Operasional (IDR)</span>
          </div>

          {/* GROSS PROFIT */}
          <div className="rounded-xl border-l-4 border-l-cyan-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Profit</p>
            <h3 className="mt-1 text-xl font-black text-slate-800 dark:text-zinc-100">Rp {k.grossProfit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</h3>
            <div className="flex justify-between text-xs mt-1 font-semibold">
              <span className="text-slate-400">Margin:</span>
              <span className={`${k.profitMargin > 0 ? "text-green-600 dark:text-green-400" : "text-red-600"}`}>{k.profitMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* BUDGET REMAINING */}
          <div className="rounded-xl border-l-4 border-l-teal-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Budget Operasional</p>
            <h3 className={`mt-1 text-xl font-black ${k.budgetRemaining >= 0 ? "text-slate-800 dark:text-zinc-100" : "text-red-600"}`}>
              Rp {k.budgetRemaining.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">Sisa Anggaran Belanja (Target vs Actual)</span>
          </div>

          {/* COST PER BCM */}
          <div className="rounded-xl border-l-4 border-l-violet-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Cost Per BCM</p>
            <h3 className="mt-1 text-xl font-black text-slate-800 dark:text-zinc-100">${k.costPerBcm.toFixed(3)} <span className="text-xs font-normal text-slate-400">/ BCM</span></h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">Unit Rate Biaya Tambang (USD)</span>
          </div>

          {/* COST PER TON */}
          <div className="rounded-xl border-l-4 border-l-fuchsia-500 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Cost Per Coal Ton</p>
            <h3 className="mt-1 text-xl font-black text-slate-800 dark:text-zinc-100">${k.costPerTon.toFixed(3)} <span className="text-xs font-normal text-slate-400">/ Ton</span></h3>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">Unit Rate Biaya Batubara (USD)</span>
          </div>

          {/* COST R&M */}
          <div className="rounded-xl border-l-4 border-l-amber-600 border-y border-r border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biaya Perbaikan & Pemeliharaan (R&M)</p>
                <h3 className="mt-1 text-xl font-black text-blue-600 dark:text-blue-400">Rp {k.costRM.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</h3>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20">
                  {k.totalRevenue > 0 ? ((k.costRM / k.totalRevenue) * 100).toFixed(2) : "0.00"}% dari Nett Revenue
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-2 block">Pengeluaran pemeliharaan alat berat (IDR)</span>
          </div>
        </div>
      </div>

      {/* 4. Graphical Analysis and charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Trends */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-100">Tren Produksi Harian (Last 15 Records)</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.productionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="Date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="OB_Actual" name="OB Actual" fill="#3b82f6" />
                <Bar dataKey="OB_Target" name="OB Target" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rain, Slippery and Fuel Ratio trend */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-100">Analisis Dampak Cuaca & Efisiensi BBM</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trendData}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSlip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "Ratio (L/BCM)", angle: 90, position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="rain" name="Rain Hours" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRain)" />
                <Area yAxisId="left" type="monotone" dataKey="slippery" name="Slippery Hours" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSlip)" />
                <Line yAxisId="right" type="monotone" dataKey="fuelRatio" name="Fuel Ratio" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI DETAIL MODAL (DRILL-DOWN) */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">Detail Analisis Drill-Down: {selectedKpi}</h3>
            <p className="text-sm text-gray-500 mb-4">Pemeriksaan target, realisasi, dan deviasi variabel operasional.</p>
            <div className="space-y-4">
              {selectedKpi === "OB" && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Plan (Target) Volume OB:</span>
                    <span className="font-mono font-semibold">{k.targetOB.toLocaleString()} BCM</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Actual (Realisasi) Volume OB:</span>
                    <span className="font-mono font-semibold">{k.actualOB.toLocaleString()} BCM</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Variansi Volume:</span>
                    <span className={`font-mono font-semibold ${k.actualOB - k.targetOB >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(k.actualOB - k.targetOB).toLocaleString()} BCM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Persentase Capaian OB:</span>
                    <span className="font-semibold text-blue-600">{k.achOB.toFixed(2)}%</span>
                  </div>
                </>
              )}
              {selectedKpi === "COAL" && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Plan (Target) Volume Coal:</span>
                    <span className="font-mono font-semibold">{k.targetCoal.toLocaleString()} Ton</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Actual (Realisasi) Volume Coal:</span>
                    <span className="font-mono font-semibold">{k.actualCoal.toLocaleString()} Ton</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Variansi Volume:</span>
                    <span className={`font-mono font-semibold ${k.actualCoal - k.targetCoal >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(k.actualCoal - k.targetCoal).toLocaleString()} Ton
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Persentase Capaian Coal:</span>
                    <span className="font-semibold text-blue-600">{k.achCoal.toFixed(2)}%</span>
                  </div>
                </>
              )}
              {selectedKpi === "RAIN" && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Target Maks Hujan Harian:</span>
                    <span className="font-mono font-semibold">{k.targetRain.toFixed(2)} Jam</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Realisasi Hujan Terjadi:</span>
                    <span className="font-mono font-semibold">{k.actualRain.toFixed(2)} Jam</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status Dampak:</span>
                    <span className={`font-semibold ${k.actualRain <= k.targetRain ? "text-green-600" : "text-red-600"}`}>
                      {k.actualRain <= k.targetRain ? "Aman / Di bawah batas" : "Tinggi / Menghambat Kerja"}
                    </span>
                  </div>
                </>
              )}
              {selectedKpi === "SLIPPERY" && (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Target Maks Jalan Licin:</span>
                    <span className="font-mono font-semibold">{k.targetSlippery.toFixed(2)} Jam</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Realisasi Slippery Terjadi:</span>
                    <span className="font-mono font-semibold">{k.actualSlippery.toFixed(2)} Jam</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status Dampak:</span>
                    <span className={`font-semibold ${k.actualSlippery <= k.targetSlippery ? "text-green-600" : "text-red-600"}`}>
                      {k.actualSlippery <= k.targetSlippery ? "Aman / Jalan normal" : "Kritis / Ambles & Licin"}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedKpi(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
