import React, { useState, useEffect } from "react";
import { PnlReport, PnlSummaryItem } from "../types";
import { Download, FileSpreadsheet, Printer, RefreshCw, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import * as XLSX from "xlsx";

interface ProfitLossProps {
  filters: {
    jobsite: string;
    month: string;
    year: string;
    startDate: string;
    endDate: string;
  };
}

export default function ProfitLoss({ filters }: ProfitLossProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PnlReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPnl = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/pnl?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load P&L Report");
      const report: PnlReport = await res.json();
      setData(report);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
  }, [filters]);

  const formatNumber = (val: number, isCurrency = true, decimals = 2) => {
    if (val === undefined || val === null) return "-";
    // Check if it's a base rate or simple count
    if (!isCurrency) {
      return val.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    return val.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const getRowClass = (item: PnlSummaryItem) => {
    if (item.isHeader) return "bg-gray-100 font-semibold text-gray-900 border-t-2 border-b border-gray-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700";
    if (item.indent === 0) return "font-medium text-gray-800 dark:text-zinc-200";
    return "text-gray-600 dark:text-zinc-400";
  };

  const getIndentClass = (item: PnlSummaryItem) => {
    if (item.indent === 1) return "pl-6";
    if (item.indent === 2) return "pl-12";
    return "pl-2";
  };

  const getVarianceColor = (item: PnlSummaryItem) => {
    const isDirectCost = item.name.includes("Cost") || item.name.includes("Deduction") || item.name.includes("PPh 23");
    const v = item.variance;
    if (v === 0) return "text-gray-500";
    if (isDirectCost) {
      // Cost increase is bad (red), cost decrease is good (green)
      return v > 0 ? "text-red-600 font-semibold dark:text-red-400" : "text-green-600 font-semibold dark:text-green-400";
    } else {
      // Revenue increase is good (green), decrease is bad (red)
      return v > 0 ? "text-green-600 font-semibold dark:text-green-400" : "text-red-600 font-semibold dark:text-red-400";
    }
  };

  // Excel Export using SheetJS
  const exportToExcel = () => {
    if (!data) return;
    const worksheetData = [
      ["ITEM", "UNIT", "TARGET", "ACTUAL", "VARIANCE", "VARIANCE %"],
      ...data.items.map(it => [
        it.name,
        it.unit,
        it.target,
        it.actual,
        it.variance,
        it.variancePercent
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
    XLSX.writeFile(wb, `PNL_Report_${filters.jobsite}_${filters.year}_${filters.month}.xlsx`);
  };

  // CSV Export
  const exportToCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,ITEM;UNIT;TARGET;ACTUAL;VARIANCE;VARIANCE %\n";
    data.items.forEach(it => {
      csvContent += `"${it.name}";"${it.unit}";"${it.target}";"${it.actual}";"${it.variance}";"${it.variancePercent}%"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PNL_Report_${filters.jobsite}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="pnl-section" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Laporan Profit & Loss (P&L)</h3>
          <p className="text-xs text-slate-400 font-medium">
            Kalkulasi otomatis dari data operating cost dan sales revenue untuk {filters.jobsite === "ALL" ? "Seluruh Jobsite" : filters.jobsite}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPnl}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            REFRESH
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            EXPORT EXCEL
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            PRINT PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <p>Terjadi kesalahan: {error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="print-area overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-3">ITEM CATEGORY (COA)</th>
                  <th scope="col" className="px-4 py-3 text-center">UNIT</th>
                  <th scope="col" className="px-6 py-3 text-right">TARGET</th>
                  <th scope="col" className="px-6 py-3 text-right">ACTUAL</th>
                  <th scope="col" className="px-6 py-3 text-right">VARIANCE</th>
                  <th scope="col" className="px-4 py-3 text-center">VARIANCE %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {data.items.map((item, idx) => {
                  const isCur = !["TON", "BCM", "HRS", "USD", ""].includes(item.unit);
                  const isRate = ["USD", "IDR"].includes(item.unit) && item.name.includes("Price") || item.name.includes("Kurs");
                  const dec = isRate ? (item.name.includes("Kurs") ? 0 : 3) : 2;

                  return (
                    <tr key={idx} className={getRowClass(item)}>
                      <td className={`px-6 py-3 whitespace-nowrap ${getIndentClass(item)}`}>
                        {item.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-mono font-bold text-gray-500 dark:text-zinc-400">
                        {item.unit || "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-mono">
                        {item.isHeader && item.target === 0 ? "" : formatNumber(item.target, isCur, dec)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-mono">
                        {item.isHeader && item.actual === 0 ? "" : formatNumber(item.actual, isCur, dec)}
                      </td>
                      <td className={`px-6 py-3 whitespace-nowrap text-right font-mono ${getVarianceColor(item)}`}>
                        {item.isHeader && item.variance === 0 ? "" : formatNumber(item.variance, isCur, dec)}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-center font-mono text-xs ${getVarianceColor(item)}`}>
                        {item.isHeader && item.variancePercent === 0 ? "" : (item.variancePercent > 0 ? "+" : "") + formatNumber(item.variancePercent, false, 1) + "%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
