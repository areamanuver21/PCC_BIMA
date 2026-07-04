import React, { useState } from "react";
import { Copy, Check, FileCode, CheckCircle, ListTodo, ShieldAlert } from "lucide-react";
import { CODE_GS, INDEX_HTML } from "../db/gas-code";

export default function GASExport() {
  const [activeSubTab, setActiveSubTab] = useState<"gs" | "html">("gs");
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopy = (code: string, type: "gs" | "html") => {
    navigator.clipboard.writeText(code);
    if (type === "gs") {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header instructions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          Panduan Deployment Google Apps Script (GAS) Web App
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Ekspor sistem Cost Control batubara ini langsung ke Google Workspace Anda sebagai Web App internal secara gratis dengan integrasi database Spreadsheet!
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Step list */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-blue-600">Langkah Pemasangan (Deployment)</h5>
            <ol className="list-decimal pl-5 text-xs text-gray-600 dark:text-zinc-400 space-y-2.5">
              <li>Buka <strong>Google Spreadsheet</strong> baru atau yang sudah ada di akun Google Drive Anda.</li>
              <li>Klik menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Ganti seluruh isi file <code>Code.gs</code> dengan menyalin kode di tab <strong>Code.gs</strong> sebelah kanan.</li>
              <li>Buat file baru di panel kiri dengan klik tombol <strong>+</strong> &gt; pilih <strong>HTML</strong>, dan beri nama <code>Index</code> (pastikan penamaan <code>Index.html</code> tanpa ekstensi ganda).</li>
              <li>Salin seluruh kode dari tab <strong>Index.html</strong> sebelah kanan dan timpa isi file HTML tersebut.</li>
              <li>Klik ikon <strong>Save (Simpan)</strong> di atas script editor.</li>
              <li>Jalankan fungsi <code>setupSheets</code> sekali di script editor untuk membuat seluruh Sheet dan format header secara otomatis!</li>
              <li>Klik tombol <strong>Deploy (Terapkan)</strong> &gt; <strong>New Deployment (Terapkan Baru)</strong> &gt; pilih tipe <strong>Web App (Aplikasi Web)</strong>.</li>
              <li>Atur hak akses ke <em>"Anyone (Siapa saja)"</em> dan jalankan otorisasi akun Google Anda. Selesai! Web App siap digunakan.</li>
            </ol>
          </div>

          {/* System constraints warning */}
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/40 text-xs text-gray-600 dark:text-zinc-400 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-200">
              <ListTodo className="h-4.5 w-4.5 text-blue-500" />
              <span>Karakteristik & Keunggulan Google Sheets Database:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Keamanan Google OAuth</strong>: Terintegrasi dengan otentikasi Google Login internal.</li>
              <li><strong>Zero Cost Hosting</strong>: Berjalan sepenuhnya di server cloud infrastruktur Google Apps Script secara gratis.</li>
              <li><strong>Kolaborasi Real-time</strong>: Data spreadsheet dapat dilihat langsung dan berkolaborasi dengan tim tambang lain.</li>
              <li><strong>Rollback Proteksi</strong>: Modul CSV upload di dalam <code>Code.gs</code> telah dilengkapi pengamanan data atomik yang otomatis membatalkan perubahan jika file rusak.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code viewer tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("gs")}
              className={`rounded px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                activeSubTab === "gs" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Code.gs (Google Script)
            </button>
            <button
              onClick={() => setActiveSubTab("html")}
              className={`rounded px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                activeSubTab === "html" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Index.html (Frontend)
            </button>
          </div>
          <button
            onClick={() => handleCopy(activeSubTab === "gs" ? CODE_GS : INDEX_HTML, activeSubTab)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
          >
            {activeSubTab === "gs" ? (
              copiedGs ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />
            ) : (
              copiedHtml ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />
            )}
            <span>{activeSubTab === "gs" ? (copiedGs ? "Tersalin!" : "Salin Code.gs") : (copiedHtml ? "Tersalin!" : "Salin Index.html")}</span>
          </button>
        </div>

        {/* Code display window */}
        <div className="bg-zinc-950 p-5 font-mono text-[11px] leading-relaxed text-zinc-300 max-h-[500px] overflow-y-auto">
          <pre className="whitespace-pre">
            {activeSubTab === "gs" ? CODE_GS : INDEX_HTML}
          </pre>
        </div>
      </div>
    </div>
  );
}
