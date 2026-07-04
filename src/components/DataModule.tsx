import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

interface DataModuleProps {
  filters: {
    jobsite: string;
    month: string;
    year: string;
    startDate: string;
    endDate: string;
  };
}

type SheetKey = "LOGPRODUKSI" | "PTY" | "SALES_REVENUE_ACTUAL" | "SALES_REVENUE_TARGET" | "OPR_COST_ACTUAL" | "OPR_COST_TARGET";

export default function DataModule({ filters }: DataModuleProps) {
  const [selectedSheet, setSelectedSheet] = useState<SheetKey>("LOGPRODUKSI");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // CRUD Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  const sheets: { key: SheetKey; label: string }[] = [
    { key: "LOGPRODUKSI", label: "Log Produksi Tambang" },
    { key: "PTY", label: "Productivity Alat (PTY)" },
    { key: "SALES_REVENUE_ACTUAL", label: "Sales Revenue (Actual)" },
    { key: "SALES_REVENUE_TARGET", label: "Sales Revenue (Target)" },
    { key: "OPR_COST_ACTUAL", label: "Operating Cost (Actual)" },
    { key: "OPR_COST_TARGET", label: "Operating Cost (Target)" }
  ];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/${selectedSheet}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setItems(data);
      setCurrentPage(1);
      setSelectedIds([]); // Reset selection on new fetch
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedSheet]);

  const handleSort = (field: string) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
  };

  const getColumns = (): { key: string; label: string }[] => {
    switch (selectedSheet) {
      case "LOGPRODUKSI":
        return [
          { key: "Date", label: "Date" },
          { key: "Jobsite", label: "Jobsite" },
          { key: "Activity", label: "Activity" },
          { key: "PlanDailyProduction", label: "Target Daily Prod" },
          { key: "ActualDailyProduction", label: "Actual Daily Prod" },
          { key: "ActualDailyDistance", label: "Actual Distance (m)" },
          { key: "ActualFuelUsage", label: "Fuel Usage (L)" },
          { key: "ActualDailyFuelRatio", label: "Fuel Ratio" },
          { key: "ActualDailyRain", label: "Rain (Hrs)" },
          { key: "ActualDailySlippery", label: "Slippery (Hrs)" }
        ];
      case "PTY":
        return [
          { key: "DATE", label: "Date" },
          { key: "JOBSITE", label: "Jobsite" },
          { key: "UNIT_NO", label: "Unit No" },
          { key: "WORKGROUP", label: "Workgroup" },
          { key: "MODEL", label: "Model" },
          { key: "EWH", label: "EWH" },
          { key: "STB", label: "STB" },
          { key: "BD", label: "BD" },
          { key: "PROD_OB_TTL", label: "PROD OB TTL" },
          { key: "PROD_COAL_TTL", label: "PROD COAL TTL" }
        ];
      case "SALES_REVENUE_ACTUAL":
      case "SALES_REVENUE_TARGET":
        return [
          { key: "Date", label: "Date" },
          { key: "Site", label: "Site" },
          { key: "Workgroup", label: "Workgroup" },
          { key: "Coal", label: "Coal (Ton)" },
          { key: "Overburden", label: "OB (BCM)" },
          { key: "PriceOverburden", label: "Price OB ($)" },
          { key: "Kurs", label: "Kurs (Rp)" },
          { key: "RevenueOB", label: "Revenue OB (Rp)" },
          { key: "RevenueFuelCompensation", label: "Fuel Comp (Rp)" },
          { key: "RevenueOverDistance", label: "Over Distance (Rp)" }
        ];
      case "OPR_COST_ACTUAL":
      case "OPR_COST_TARGET":
        return [
          { key: "Date", label: "Date" },
          { key: "Site", label: "Site" },
          { key: "Workgroup", label: "Workgroup" },
          { key: "RepairMaintenanceCost", label: "Repair & Maint (Rp)" },
          { key: "EmployeeCostDirect", label: "Employee Direct (Rp)" },
          { key: "DrillBlastingCost", label: "Drill & Blast (Rp)" },
          { key: "LeasingCapexInvestation", label: "Leasing/Capex (Rp)" },
          { key: "HRDGAOperasional", label: "HRD & GA (Rp)" },
          { key: "BiayaHOBalikpapan", label: "HO Cost (Rp)" }
        ];
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem ? `/api/data/${selectedSheet}/${editingItem.id}` : `/api/data/${selectedSheet}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setModalOpen(false);
        setEditingItem(null);
        setFormData({});
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/data/${selectedSheet}/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmResult = await Swal.fire({
      title: "Hapus Data Terpilih?",
      text: `Anda akan menghapus ${selectedIds.length} baris data secara permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/data/${selectedSheet}/batch-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Dihapus",
          text: `${selectedIds.length} data berhasil dihapus dari sistem.`,
          timer: 1500,
          showConfirmButton: false
        });
        setSelectedIds([]);
        fetchItems();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus data.");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: err.message || "Terjadi kesalahan."
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    const initialForm: any = {};
    getColumns().forEach(col => {
      initialForm[col.key] = "";
    });
    setFormData(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  // Filters and searches items
  const getProcessedItems = () => {
    let result = [...items];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => String(val).toLowerCase().includes(query));
      });
    }

    // Jobsite filter
    if (filters.jobsite && filters.jobsite !== "ALL") {
      result = result.filter(item => {
        const site = item.Jobsite || item.Site || item.JOBSITE;
        return String(site).toLowerCase() === filters.jobsite.toLowerCase();
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortOrder === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return result;
  };

  const processedItems = getProcessedItems();
  const totalPages = Math.ceil(processedItems.length / itemsPerPage);
  const paginatedItems = processedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportTableToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processedItems);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedSheet);
    XLSX.writeFile(wb, `${selectedSheet}_Data_Export.xlsx`);
  };

  const isAllOnPageSelected = paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.id));

  const handleToggleSelectAll = () => {
    if (isAllOnPageSelected) {
      const pageIds = paginatedItems.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedItems.map(item => item.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector & Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {sheets.map(sheet => (
            <button
              key={sheet.key}
              onClick={() => setSelectedSheet(sheet.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                selectedSheet === sheet.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {sheet.key === "LOGPRODUKSI" ? "Log Produksi" : sheet.label.replace(" (Actual)", "").replace(" (Target)", "")}
              {sheet.key.includes("TARGET") && <span className="ml-1 text-[10px] bg-amber-500 text-white px-1 py-0.5 rounded font-bold">Target</span>}
              {sheet.key.includes("ACTUAL") && <span className="ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded font-bold">Actual</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm animate-pulse"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Terpilih ({selectedIds.length})
            </button>
          )}
          <button
            onClick={exportTableToExcel}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Baris
          </button>
        </div>
      </div>

      {/* Searching and Information Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari data..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
          Menampilkan <span className="font-semibold text-gray-700 dark:text-zinc-200">{processedItems.length}</span> baris
        </p>
      </div>

      {/* Interactive Spreadsheet-Style Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-center w-10 select-none">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleToggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {getColumns().map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-6 py-3 whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {sortField === col.key && (sortOrder === "asc" ? "▲" : "▼")}
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={getColumns().length + 2} className="py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={getColumns().length + 2} className="py-8 text-center text-gray-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr 
                      key={item.id || idx} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      {getColumns().map(col => {
                        const val = item[col.key];
                        const isNum = typeof val === "number";
                        return (
                          <td key={col.key} className="px-6 py-3 whitespace-nowrap font-mono text-xs">
                            {isNum ? val.toLocaleString("id-ID", { maximumFractionDigits: 3 }) : String(val || "-")}
                          </td>
                        );
                      })}
                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4">
              {editingItem ? "Edit Data Record" : "Tambah Baris Data Baru"}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-2 gap-4">
              {getColumns().map(col => (
                <div key={col.key} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{col.label}</label>
                  <input
                    type="text"
                    required
                    value={formData[col.key] ?? ""}
                    onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              ))}
              <div className="col-span-2 mt-6 flex justify-end gap-2 border-t pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
