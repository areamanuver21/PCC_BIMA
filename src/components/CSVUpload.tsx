import React, { useState, useEffect } from "react";
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  Download, 
  RefreshCw, 
  ClipboardList, 
  ShieldCheck,
  Cloud,
  Search,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { googleSignIn, initGoogleAuth } from "../lib/googleAuth";

type SheetKey = "LOGPRODUKSI" | "PTY" | "SALES_REVENUE_ACTUAL" | "SALES_REVENUE_TARGET" | "OPR_COST_ACTUAL" | "OPR_COST_TARGET";

export default function CSVUpload() {
  const [selectedSheet, setSelectedSheet] = useState<SheetKey>("LOGPRODUKSI");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({ status: "idle", message: "" });
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Google Drive Integrations State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [gdriveCsvText, setGdriveCsvText] = useState<string | null>(null);

  // Subscribe to auth state on mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const sheets: { key: SheetKey; label: string; desc: string }[] = [
    { key: "LOGPRODUKSI", label: "Log Produksi Tambang", desc: "Data Overburden, Coal, Rain, Slippery harian." },
    { key: "PTY", label: "Productivity Alat (PTY)", desc: "Data Equipment EWH, BD, PA, UA harian." },
    { key: "SALES_REVENUE_ACTUAL", label: "Sales Revenue (Actual)", desc: "Realisasi penerimaan penjualan tambang." },
    { key: "SALES_REVENUE_TARGET", label: "Sales Revenue (Target)", desc: "Rencana/budget penerimaan penjualan." },
    { key: "OPR_COST_ACTUAL", label: "Operating Cost (Actual)", desc: "Realisasi pengeluaran biaya operasional." },
    { key: "OPR_COST_TARGET", label: "Operating Cost (Target)", desc: "Rencana/budget pengeluaran operasional." }
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setUploadLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndValidateCSV(text);
    };
    reader.readAsText(file);
  };

  // Perform client-side pre-validation and preview parsing
  const parseAndValidateCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length === 0 || !lines[0]) {
      setValidationResult({ status: "error", message: "Gagal: File CSV kosong!" });
      return;
    }

    // Determine separator (; or ,)
    let separator = ";";
    if (lines[0].indexOf(",") !== -1 && lines[0].indexOf(";") === -1) {
      separator = ",";
    }

    const fileHeaders = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ""));
    setHeaders(fileHeaders);

    // Expected Headers
    let expected: string[] = [];
    if (selectedSheet === "LOGPRODUKSI") {
      expected = ["Date", "Plan Daily Production", "Actual Daily Production", "Actual Daily Distance", "Plan MTD Production", "Actual MTD Production", "Actual MTD Distance", "Actual Fuel Usage", "Actual MTD Fuel Usage", "Plan Daily Rain", "Actual Daily Rain", "Plan Daily Slippery", "Actual Daily Slippery", "Actual Daily Fuel Ratio", "Actual MTD Fuel Ratio", "Jobsite", "Activity"];
    } else if (selectedSheet === "PTY") {
      expected = ["DATE", "JOBSITE", "UNIT_NO", "WORKGROUP", "MODEL", "EWH", "STB", "BD", "MOHH", "EWH OB", "EWH CO", "PROD OB TTL", "PROD COAL TTL", "PRODUCTIVITY_OB", "PRODUCTIVITY_COAL", "PHYSICAL AVAILABILITY (PA)", "USE OF AVAILABILITY (UA)"];
    } else if (selectedSheet === "SALES_REVENUE_ACTUAL" || selectedSheet === "SALES_REVENUE_TARGET") {
      expected = ["Date", "Site", "Workgroup", "Price Coal ($/Ton)", "Price Overburden ($/BCM)", "Price Mud ($/BCM)", "Price Topsoil ($/BCM)", "Kurs Rp per USD", "Coal", "Overburden", "Mud", "Topsoil", "Rental Excavator", "Rental Dozer", "Sediment Trap", "Revenue Coal", "Revenue OB", "Revenue Topsoil", "Revenue Mud", "Revenue Fuel Compensation", "Revenue Over Distance", "Revenue Rental", "Revenue Sediment Trap", "PPh 23", "Deposit 1% (Overburden Revenue)"];
    } else if (selectedSheet === "OPR_COST_ACTUAL" || selectedSheet === "OPR_COST_TARGET") {
      expected = ["Date", "Site", "Workgroup", "Repair & Maintenance Cost", "Employee Cost Direct", "Drill & Blasting Cost", "Leasing, Capex & Investation", "HRD & GA Operasional", "Logistik", "IT & Engineering", "Safety", "Biaya HO Balikpapan", "Lain-Lain (HO)"];
    }

    // Compare headers case-insensitive
    const missing = expected.filter(
      eh => !fileHeaders.some(fh => fh.toLowerCase() === eh.toLowerCase())
    );

    if (missing.length > 0) {
      setValidationResult({
        status: "error",
        message: `Validasi Kolom Gagal! Kolom penting berikut tidak ditemukan: ${missing.join(", ")}`
      });
      setParsedRows([]);
      return;
    }

    // Process preview rows (up to 5 rows)
    const previewRows: any[] = [];
    const limit = Math.min(lines.length, 6);
    for (let i = 1; i < limit; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ""));
      const rowObj: any = {};
      expected.forEach(exH => {
        const fhIdx = fileHeaders.findIndex(fh => fh.toLowerCase() === exH.toLowerCase());
        rowObj[exH] = fhIdx !== -1 ? cols[fhIdx] : "";
      });
      previewRows.push(rowObj);
    }

    setParsedRows(previewRows);
    setValidationResult({
      status: "success",
      message: `Validasi Berhasil! File memiliki format ${selectedSheet} yang sesuai. Siap diunggah (Preview menampilkan ${previewRows.length} dari ${lines.length - 1} baris).`
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    const performImport = async (csvText: string) => {
      try {
        const res = await fetch(`/api/import/${selectedSheet}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText, fileName: file.name })
        });

        const result = await res.json();
        if (res.ok && result.success) {
          Swal.fire({
            icon: "success",
            title: "Import Sukses!",
            text: `Berhasil mengimpor ${result.rowsCount} baris data ke sheet ${selectedSheet}.`,
            confirmButtonColor: "#3b82f6"
          });
          setFile(null);
          setGdriveCsvText(null);
          setParsedRows([]);
          setValidationResult({ status: "idle", message: "" });
          fetchLogs();
        } else {
          // If server fails, the atomic transaction triggers a database rollback
          Swal.fire({
            icon: "error",
            title: "Import Gagal & Database Rolled Back!",
            text: result.error || "Gagal mengimpor file.",
            footer: '<span class="text-xs text-red-500">Sistem melakukan rollback otomatis untuk menjaga integritas data.</span>',
            confirmButtonColor: "#ef4444"
          });
          fetchLogs();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setImporting(false);
      }
    };

    if (gdriveCsvText) {
      await performImport(gdriveCsvText);
    } else {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const csvText = e.target?.result as string;
          await performImport(csvText);
        };
        reader.readAsText(file);
      } catch (e: any) {
        console.error(e);
        setImporting(false);
      }
    }
  };

  const openGoogleDrivePicker = async () => {
    let token = accessToken;
    if (!token) {
      const confirm = await Swal.fire({
        title: "Sambungkan Google Drive",
        text: "Anda belum menyambungkan akun Google Drive Anda. Sambungkan sekarang?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#475569",
        confirmButtonText: "Ya, Sambungkan",
        cancelButtonText: "Batal"
      });

      if (!confirm.isConfirmed) return;

      try {
        const res = await googleSignIn();
        if (res) {
          setGoogleUser(res.user);
          setAccessToken(res.accessToken);
          token = res.accessToken;
        } else {
          return;
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Koneksi Gagal",
          text: err.message || "Gagal menghubungkan ke Google Drive."
        });
        return;
      }
    }

    setShowDrivePicker(true);
    setPickerLoading(true);
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=(mimeType='text/csv' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or name contains '.csv') and trashed=false&fields=files(id,name,mimeType,size,createdTime)&orderBy=createdTime desc&pageSize=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleSelectDriveFile = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    setShowDrivePicker(false);

    Swal.fire({
      title: "Mengunduh Berkas...",
      text: `Sedang mengunduh file ${fileName} dari Google Drive Anda.`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error("Gagal mengunduh isi file dari Google Drive.");
      const text = await res.text();

      setFile({ name: fileName } as any);
      setGdriveCsvText(text);
      parseAndValidateCSV(text);

      Swal.close();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Berkas berhasil dimuat!",
        showConfirmButton: false,
        timer: 2000
      });
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Unduhan Gagal",
        text: err.message || "Terjadi kesalahan saat memproses file dari Google Drive."
      });
    }
  };

  // Generate downloadable blank templates based on headers
  const downloadTemplate = () => {
    let expected: string[] = [];
    let sampleRow: string[] = [];
    if (selectedSheet === "LOGPRODUKSI") {
      expected = ["Date", "Plan Daily Production", "Actual Daily Production", "Actual Daily Distance", "Plan MTD Production", "Actual MTD Production", "Actual MTD Distance", "Actual Fuel Usage", "Actual MTD Fuel Usage", "Plan Daily Rain", "Actual Daily Rain", "Plan Daily Slippery", "Actual Daily Slippery", "Actual Daily Fuel Ratio", "Actual MTD Fuel Ratio", "Jobsite", "Activity"];
      sampleRow = ["01-Jan-26", "21757.12", "17723.00", "1536.00", "43514.24", "23146.50", "1667.92", "23567.00", "25863.00", "3.68", "2.25", "1.46", "3.17", "1.33", "1.12", "BIMA - Susubang", "OB"];
    } else if (selectedSheet === "PTY") {
      expected = ["DATE", "JOBSITE", "UNIT_NO", "WORKGROUP", "MODEL", "EWH", "STB", "BD", "MOHH", "EWH OB", "EWH CO", "PROD OB TTL", "PROD COAL TTL", "PRODUCTIVITY_OB", "PRODUCTIVITY_COAL", "PHYSICAL AVAILABILITY (PA)", "USE OF AVAILABILITY (UA)"];
      sampleRow = ["01/06/2026", "BIMA - SJ", "DT-160", "OB", "ZS1EPPD-4141", "6.00", "12.07", "5.93", "24.00", "6.00", "0", "288.00", "0", "48.00", "0", "75.3%", "33.2%"];
    } else if (selectedSheet === "SALES_REVENUE_ACTUAL" || selectedSheet === "SALES_REVENUE_TARGET") {
      expected = ["Date", "Site", "Workgroup", "Price Coal ($/Ton)", "Price Overburden ($/BCM)", "Price Mud ($/BCM)", "Price Topsoil ($/BCM)", "Kurs Rp per USD", "Coal", "Overburden", "Mud", "Topsoil", "Rental Excavator", "Rental Dozer", "Sediment Trap", "Revenue Coal", "Revenue OB", "Revenue Topsoil", "Revenue Mud", "Revenue Fuel Compensation", "Revenue Over Distance", "Revenue Rental", "Revenue Sediment Trap", "PPh 23", "Deposit 1% (Overburden Revenue)"];
      sampleRow = ["01-Jan-26", "BIMA - Susubang", "OB", "3.3", "1.794", "1.96", "1.345", "16000", "0", "33679.50", "0", "0", "0", "0", "0", "0", "966483098.16", "0", "0", "28078294.88", "-341992.42", "0", "0", "19884388.01", "9664830.98"];
    } else if (selectedSheet === "OPR_COST_ACTUAL" || selectedSheet === "OPR_COST_TARGET") {
      expected = ["Date", "Site", "Workgroup", "Repair & Maintenance Cost", "Employee Cost Direct", "Drill & Blasting Cost", "Leasing, Capex & Investation", "HRD & GA Operasional", "Logistik", "IT & Engineering", "Safety", "Biaya HO Balikpapan", "Lain-Lain (HO)"];
      sampleRow = ["01-Jan-26", "BIMA - Susubang", "OB", "98240072.58", "148144601.45", "119675170.43", "108534260.67", "7674784.05", "1342047.89", "1543963.35", "1761766.13", "0", "0"];
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + expected.join(";") + "\n"
      + sampleRow.join(";");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TEMPLATE_${selectedSheet}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Upload Panel and Selections */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-2">Import / Upload File Log CSV</h4>
          <p className="text-xs text-gray-500 mb-4">Pilih jenis data, unduh template, dan unggah file Anda dengan sistem validasi otomatis.</p>

          <div className="space-y-4">
            {/* Sheet select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Jenis Tab Spreadsheet</label>
              <div className="grid grid-cols-2 gap-2">
                {sheets.map(sh => (
                  <div
                    key={sh.key}
                    onClick={() => {
                      setSelectedSheet(sh.key);
                      setFile(null);
                      setParsedRows([]);
                      setValidationResult({ status: "idle", message: "" });
                    }}
                    className={`cursor-pointer rounded-lg border p-3 transition hover:border-blue-300 ${
                      selectedSheet === sh.key
                        ? "border-blue-600 bg-blue-50/20 dark:border-blue-500 dark:bg-blue-950/10"
                        : "border-gray-200 dark:border-zinc-800"
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{sh.label}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{sh.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Downloader */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-zinc-800/40">
              <span className="text-xs text-gray-500">Butuh template kolom yang cocok?</span>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 rounded bg-white border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
              >
                <Download className="h-3 w-3 text-blue-500" />
                Unduh Template CSV
              </button>
            </div>

            {/* Google Drive Picker Trigger */}
            <div className="flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 p-3 dark:bg-indigo-950/10 dark:border-indigo-900/30">
              <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-indigo-500" />
                <span>Punya file log di awan?</span>
              </span>
              <button
                onClick={openGoogleDrivePicker}
                className="flex items-center gap-1.5 rounded bg-indigo-650 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer transition"
              >
                <Cloud className="h-3.5 w-3.5" />
                Pilih Berkas Google Drive
              </button>
            </div>

            {/* Drag and Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50/10"
                  : "border-gray-300 bg-white hover:border-gray-400 dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center text-center space-y-2 pointer-events-none">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/10 dark:text-blue-400">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                  {file ? file.name : "Seret & Letakkan file CSV di sini"}
                </p>
                <p className="text-xs text-gray-400">
                  atau klik untuk memilih file dari komputer Anda (Maks. 50MB)
                </p>
              </div>
            </div>

            {/* Validation Feedback */}
            {validationResult.status !== "idle" && (
              <div
                className={`flex items-start gap-3 rounded-lg p-3.5 text-xs ${
                  validationResult.status === "success"
                    ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/10 dark:border-green-800 dark:text-green-400"
                    : "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/10 dark:border-red-800 dark:text-red-400"
                }`}
              >
                {validationResult.status === "success" ? (
                  <CheckCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{validationResult.status === "success" ? "Validasi Sukses" : "Validasi Gagal"}</p>
                  <p className="mt-1">{validationResult.message}</p>
                </div>
              </div>
            )}

            {/* Import Trigger */}
            {validationResult.status === "success" && (
              <div className="flex items-center justify-between border-t pt-4 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sistem Transaksi Atomik Aktif (Rollback Garansi Aman)</span>
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Mengimpor...
                    </>
                  ) : (
                    <>
                      Impor ke Spreadsheet
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live parsed preview grid */}
        {parsedRows.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">Pratinjau Data Impor (Maks. 5 Baris Pertama)</h5>
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-800">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold dark:bg-zinc-800 dark:text-zinc-400">
                  <tr>
                    {headers.slice(0, 8).map((h, i) => (
                      <th key={i} className="px-4 py-2 whitespace-nowrap">{h}</th>
                    ))}
                    {headers.length > 8 && <th className="px-4 py-2">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                      {Object.values(row).slice(0, 8).map((val: any, colI) => (
                        <td key={colI} className="px-4 py-2 whitespace-nowrap font-mono">{String(val || "-")}</td>
                      ))}
                      {headers.length > 8 && <td className="px-4 py-2 font-bold">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload History / Logs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-fit">
        <div className="flex items-center gap-2 border-b pb-3 mb-4 dark:border-zinc-800">
          <ClipboardList className="h-5 w-5 text-gray-500" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Riwayat Impor & Unggah Log</h4>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : uploadLogs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Belum ada riwayat impor.</p>
          ) : (
            uploadLogs.map((log, idx) => (
              <div key={idx} className="rounded-lg border p-3 text-xs dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 dark:text-zinc-200">{log.sheet}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      log.status === "SUCCESS"
                        ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">File: {log.fileName}</p>
                {log.status === "SUCCESS" ? (
                  <p className="text-[10px] text-green-600 mt-1 font-semibold">Berhasil mengimpor {log.rowsCount} baris.</p>
                ) : (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">Error: {log.errorMessage}</p>
                )}
                <span className="text-[9px] text-gray-400 mt-2 block">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Google Drive File Picker Modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Cloud className="h-5 w-5 text-indigo-400" />
                Pilih Berkas dari Google Drive
              </h3>
              <button
                onClick={() => setShowDrivePicker(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari file .csv di Google Drive Anda..."
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/20">
              {pickerLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                  <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold">Mengambil berkas dari cloud...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Cloud className="h-10 w-10 text-slate-800 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tidak Ada File .CSV Ditemukan</p>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-sm mx-auto">
                    Pastikan Anda memiliki file log berformat .csv yang diunggah ke Google Drive Anda.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-lg divide-y divide-slate-800 bg-slate-950/40">
                  {driveFiles
                    .filter((f) => f.name.toLowerCase().includes(pickerQuery.toLowerCase()))
                    .map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleSelectDriveFile(file.id, file.name)}
                        className="p-3 flex items-center justify-between hover:bg-indigo-950/20 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 rounded-lg">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-white transition truncate">
                              {file.name}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Ukuran: {file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : "N/A"} • Diunggah: {new Date(file.createdTime).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded transition">
                          PILIH
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDrivePicker(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
