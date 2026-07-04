import React, { useState } from "react";
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  UploadCloud, 
  LayoutDashboard, 
  FileText, 
  Database, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  FileCode2, 
  Key,
  Download,
  AlertCircle
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "auth" | "upload" | "dashboard" | "pnl" | "gas">("general");

  if (!isOpen) return null;

  const stepsUpload = [
    "Masuk ke menu 'Upload Data Log' dari panel samping.",
    "Pilih kategori data yang ingin diunggah (misal: LOGPRODUKSI, OPR_COST_ACTUAL, dll).",
    "Unduh format template CSV jika diperlukan, atau pastikan kolom file CSV Anda telah sesuai.",
    "Drag & drop file CSV Anda ke area unggahan, atau klik untuk memilih file dari komputer Anda.",
    "Sistem akan melakukan validasi format kolom otomatis. Jika ada ketidakcocokan, sistem akan memberikan peringatan mendalam.",
    "Klik 'Simpan ke Database'. Jika terjadi kegagalan data pada salah satu baris, sistem akan melakukan rollback penuh demi keandalan data."
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Petunjuk Penggunaan Aplikasi PCC-BIMA</h3>
              <p className="text-xs text-slate-400 font-medium">Panduan lengkap operasional sistem Mine Cost Control & Analytics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content Area (Sidebar Tabs + Panel) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Internal Navigation Side */}
          <div className="w-56 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-4 space-y-1 overflow-y-auto shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Daftar Modul</p>
            
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "general"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              1. Gambaran Umum
            </button>

            <button
              onClick={() => setActiveTab("auth")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "auth"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              2. Login & Otorisasi
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "upload"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <UploadCloud className="h-4 w-4 shrink-0" />
              3. Impor CSV & Log
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              4. Dashboard Analytics
            </button>

            <button
              onClick={() => setActiveTab("pnl")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "pnl"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              5. Laporan Laba Rugi (P&L)
            </button>

            <button
              onClick={() => setActiveTab("gas")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all ${
                activeTab === "gas"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <FileCode2 className="h-4 w-4 shrink-0" />
              6. Integrasi Google Sheets
            </button>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
            
            {/* TAB 1: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">1. Gambaran Umum Aplikasi</h4>
                  <p className="text-xs text-slate-400 mt-1">Mengenal platform ERP Pengendalian Biaya Tambang BIMA (PCC-BIMA)</p>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Aplikasi <strong>PCC-BIMA (PT Bima Nusa Internasional Cost Control ERP)</strong> adalah sistem integrasi data tambang mutakhir yang dirancang khusus untuk memonitor produktivitas alat berat, pengaruh cuaca (rain hours & slippery hours), konsumsi bahan bakar (Fuel), biaya perbaikan & pemeliharaan (R&M Cost), serta menyajikannya dalam bentuk laporan finansial <strong>Profit & Loss (P&L) Statement</strong> secara real-time.
                </p>

                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Manfaat Utama Penggunaan Aplikasi:
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Analisis Biaya Presisi:</strong> Memisahkan biaya operasi penambangan, biaya bahan bakar, biaya pemeliharaan alat, hingga overhead secara terstruktur per jobsite.</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Otomasi P&L:</strong> Mengurangi kebutuhan perhitungan manual dengan memproses data produksi harian dan harga indeks batubara menjadi laporan laba rugi instan.</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span><strong>Satu Dashboard untuk Semua Lokasi:</strong> Mendukung filtering cepat untuk 7 Jobsite utama (Susubang, Enviro, Iwaco, KBB, KDC, TMCT, SJ).</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-100/40 dark:border-blue-900/20">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Database Utama</span>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Penyimpanan offline JSON dengan sinkronisasi dual-engine SQLite dan Google Sheets API.</span>
                  </div>
                  <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Keandalan Transaksi</span>
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">Fitur rollback otomatis yang menjamin data tidak akan corrupt apabila terjadi error saat proses impor CSV.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUTH & ROLES */}
            {activeTab === "auth" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">2. Akses & Manajemen Pengguna</h4>
                  <p className="text-xs text-slate-400 mt-1">Mengatur otorisasi, menambah akun baru, dan peran dalam sistem</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  PCC-BIMA dilengkapi dengan pembatasan hak akses (Role-Based Access Control) untuk memastikan data sensitif seperti harga dan target biaya hanya dapat dikelola oleh personil yang berwenang.
                </p>

                <div className="overflow-hidden border border-slate-200 dark:border-zinc-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-850 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                        <th className="p-3 font-bold">Peran (Role)</th>
                        <th className="p-3 font-bold">Hak Akses Modul</th>
                        <th className="p-3 font-bold">Tindakan Khusus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-600 dark:text-zinc-300">
                      <tr>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">Administrator</td>
                        <td className="p-3">Semua modul (Dashboard, P&L, Data, Upload, GAS, Kelola Pengguna).</td>
                        <td className="p-3 font-medium">Bisa mendaftarkan dan menghapus akun staf.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">Operator</td>
                        <td className="p-3">Dashboard, Master Data, Upload Data Log, GAS Code.</td>
                        <td className="p-3 font-medium">Bisa melakukan import CSV log produksi harian.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-zinc-300">Viewer / Manager</td>
                        <td className="p-3">Dashboard Analytics & Laporan P&L (Laba Rugi).</td>
                        <td className="p-3 font-medium">Hanya melihat, mengekspor laporan, tidak bisa edit data.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-blue-500" />
                    Manajemen Pengguna (Khusus Admin):
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                    Pengguna dengan hak akses Administrator dapat mengelola akun melalui menu <strong>Kelola Pengguna</strong>:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 list-decimal pl-4">
                    <li>Isi formulir pendaftaran pengguna baru (Username, Nama Lengkap, Peran, & Password).</li>
                    <li>Sistem secara otomatis mengonversi username menjadi huruf kecil demi standardisasi login.</li>
                    <li>Hapus pengguna yang tidak lagi aktif dengan menekan ikon tong sampah merah pada daftar tabel.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: CSV IMPORT */}
            {activeTab === "upload" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">3. Mekanisme Impor & Validasi CSV</h4>
                  <p className="text-xs text-slate-400 mt-1">Mengimpor log produksi harian dan biaya secara aman tanpa merusak struktur data</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Modul impor dirancang sangat ketat untuk menghindari inkonsistensi data. Sistem akan memeriksa kesesuaian judul kolom (header) dan tipe data sebelum menyimpannya ke database.
                </p>

                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">Langkah-Langkah Mengunggah File:</h5>
                  <div className="relative border-l-2 border-blue-500 pl-4 space-y-4">
                    {stepsUpload.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-7.5 top-0 w-5 h-5 bg-blue-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 font-semibold">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400">
                  <h5 className="text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Ketentuan Penting Penulisan Karakter Angka:
                  </h5>
                  <p className="text-xs leading-relaxed">
                    Sistem PCC-BIMA mendukung parsing angka berformat Indonesia yang menggunakan titik (.) sebagai pemisah ribuan dan koma (,) sebagai pemisah desimal (Contoh: <strong>21.757,12</strong> atau <strong>5.423,50</strong>). Jika field bernilai kosong atau strip (-), sistem akan mengonversinya menjadi 0 secara otomatis.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: DASHBOARD ANALYTICS */}
            {activeTab === "dashboard" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">4. Dashboard Analytics & Grafik KPI</h4>
                  <p className="text-xs text-slate-400 mt-1">Membaca visualisasi performa tambang dan metrik operasional harian</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Dashboard adalah panel kendali utama untuk manajemen guna memonitor efisiensi tambang secara ringkas dalam satu layar.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">Minyak & Energi</span>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1">Fuel Consumption</h5>
                    <p className="text-[11px] text-slate-500">Menghitung total rasio liter per BCM/MT batubara untuk memantau pemborosan energi.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">Overburden vs Coal</span>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1">Strip Ratio (SR)</h5>
                    <p className="text-[11px] text-slate-500">Rasio perbandingan volume tanah kupasan (BCM) dengan tonase batubara (MT) yang diproduksi.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-xl border border-slate-150 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Dampak Cuaca</span>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1">Rain & Slippery</h5>
                    <p className="text-[11px] text-slate-500">Menganalisis jam kerja yang hilang akibat hujan harian guna memproyeksikan target bulanan.</p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4 text-blue-500" />
                    Cara Menggunakan Fitur Filter Global:
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Gunakan filter <strong>Jobsite</strong>, <strong>Bulan</strong>, dan <strong>Tahun</strong> yang terletak pada header bagian atas aplikasi. Seluruh diagram batang, diagram garis, grafik komparasi biaya, serta tabel pencatatan akan menyesuaikan nilainya secara otomatis tanpa memuat ulang (reload) halaman web Anda.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: PNL STATEMENT */}
            {activeTab === "pnl" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">5. Laporan Profit & Loss (P&L)</h4>
                  <p className="text-xs text-slate-400 mt-1">Memahami kalkulasi laba rugi, EBITDA, biaya perbaikan (R&M), dan ekspor laporan</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  Modul P&L memformulasikan seluruh pendapatan kotor batubara dikurangi dengan biaya-biaya langsung (Mining, Fuel, R&M, Overhead) serta memproyeksikan nilai NPV dalam jangka panjang.
                </p>

                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Struktur Formula Laba Rugi Tambang:
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Nett Revenue:</strong> Didapatkan dari Total Coal Getting (MT) dikalikan indeks harga batubara harian dari tabel PRICE.</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Mining & Fuel Cost:</strong> Diperoleh dari total volume kupas tanah dikalikan tarif standar dan konsumsi liter solar aktual.</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Repair & Maintenance (R&M) Cost:</strong> Menampilkan pengeluaran perawatan suku cadang dan mekanik alat berat. Sistem mendeteksi persentase R&M dari total pendapatan untuk menjaga batasan anggaran.</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>EBITDA & Operating Profit:</strong> Laba operasional murni sebelum depresiasi dan pajak untuk melihat kesehatan finansial riil unit tambang.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-xl border border-blue-100/40 dark:border-blue-900/20">
                  <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    Fitur Ekspor Laporan:
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Di bagian atas kanan laporan P&L, terdapat opsi <strong>Export to Excel</strong> (format .xlsx asli yang rapi), <strong>Export to CSV</strong>, serta tombol <strong>Print / PDF</strong> yang telah dioptimalkan secara visual sehingga hasil cetak bersih dari elemen sidebar menu.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: GOOGLE SHEETS */}
            {activeTab === "gas" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">6. Sinkronisasi Google Sheets (GAS)</h4>
                  <p className="text-xs text-slate-400 mt-1">Menyinkronkan data database harian lokal langsung ke Google Spreadsheet perusahaan</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  PCC-BIMA mendukung sinkronisasi dua arah ke cloud PT Bima Nusa Internasional via Google Apps Script (GAS). Ini memungkinkan staf di lapangan menggunakan interface web ini, sementara direktur di kantor melihat pembaruan data secara real-time di Google Spreadsheet.
                </p>

                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800 space-y-3">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
                    <FileCode2 className="h-4 w-4 text-blue-500" />
                    Cara Penerapan Script (Setup & Sync):
                  </h5>
                  <ol className="space-y-2 text-xs text-slate-600 dark:text-zinc-300 list-decimal pl-4 leading-relaxed">
                    <li>Masuk ke menu <strong>GAS Code Export</strong> di panel navigasi samping.</li>
                    <li>Klik tombol <strong>Salin Kode Script</strong> untuk menyalin seluruh baris program Google Apps Script yang telah di-generate secara otomatis.</li>
                    <li>Buka Google Spreadsheet target Anda, lalu klik menu <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Hapus kode bawaan, paste (tempel) kode yang telah Anda salin, lalu klik tombol **Save** dan **Deploy as Web App**.</li>
                    <li>Salin URL Web App yang dihasilkan dari Google, lalu masukkan ke kolom konfigurasi di halaman integrasi aplikasi Anda.</li>
                    <li>Data harian sekarang akan mengalir dan memicu sinkronisasi otomatis setiap kali Anda melakukan impor file log produksi baru.</li>
                  </ol>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sistem Cost Control Bima • Hubungi Administrator untuk Bantuan Lebih Lanjut
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/10 transition cursor-pointer"
          >
            Selesai Membaca
          </button>
        </div>

      </div>
    </div>
  );
}
