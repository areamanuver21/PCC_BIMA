import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  Table,
  UploadCloud,
  FileCode2,
  Moon,
  Sun,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  Users,
  LogOut,
  BookOpen,
  Cloud
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import ProfitLoss from "./components/ProfitLoss";
import DataModule from "./components/DataModule";
import CSVUpload from "./components/CSVUpload";
import GASExport from "./components/GASExport";
import UsersManagement from "./components/UsersManagement";
import LoginScreen from "./components/LoginScreen";
import BimaLogo from "./components/BimaLogo";
import UserGuideModal from "./components/UserGuideModal";
import GoogleDriveModule from "./components/GoogleDriveModule";
import { User } from "./types";

type MenuKey = "dashboard" | "pnl" | "data" | "upload" | "gas" | "users" | "drive";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("bima_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("bima_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("bima_user");
  };

  // Filter States
  const [jobsite, setJobsite] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("2026");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const jobsites = [
    "ALL",
    "BIMA - Susubang",
    "BIMA - Enviro",
    "BIMA - Iwaco",
    "BIMA - KBB",
    "BIMA - KDC",
    "BIMA - TMCT",
    "BIMA - SJ"
  ];

  const months = [
    { value: "ALL", label: "Seluruh Bulan" },
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const filters = { jobsite, month, year, startDate, endDate };

  const renderActiveView = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard filters={filters} />;
      case "pnl":
        return <ProfitLoss filters={filters} />;
      case "data":
        return <DataModule filters={filters} />;
      case "upload":
        return <CSVUpload />;
      case "gas":
        return <GASExport />;
      case "users":
        return <UsersManagement />;
      case "drive":
        return <GoogleDriveModule currentUser={currentUser} />;
    }
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1e293b] text-white shrink-0 flex flex-col border-r border-slate-200 dark:border-zinc-800 shadow-xl">
        <div className="p-5 flex items-center gap-3 bg-[#0f172a] border-b border-slate-700/40">
          <div className="w-11 h-11 bg-white rounded-lg flex items-center justify-center p-1 shadow-inner shrink-0">
            <BimaLogo className="h-9 w-auto" showText={false} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-base leading-none text-white">PCC-BIMA</span>
            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1">Cost Control ERP</span>
          </div>
        </div>

        {/* Menu Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeMenu === "dashboard"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveMenu("pnl")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeMenu === "pnl"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <FileText className="h-5 w-5" />
            Profit & Loss (P&L)
          </button>

          <button
            onClick={() => setActiveMenu("data")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeSubTabMatchesDataTab()
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <Table className="h-5 w-5" />
            <span>Master Data Sheet</span>
          </button>

          <button
            onClick={() => setActiveSubTab("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              selectedIsUpload()
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <UploadCloud className="h-5 w-5" />
            <span>Upload Data Log</span>
          </button>

          <button
            onClick={() => setActiveMenu("drive")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeMenu === "drive"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <Cloud className="h-5 w-5" />
            <span>Google Drive Cloud</span>
          </button>

          <button
            onClick={() => setActiveSubTab("gas")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              selectedIsGAS()
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <FileCode2 className="h-5 w-5" />
            <span>GAS Code Export</span>
          </button>

          <button
            onClick={() => setActiveMenu("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
              activeMenu === "users"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/10 shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white opacity-75 hover:opacity-100 font-medium"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Kelola Pengguna</span>
          </button>
        </nav>

        {/* Footer controls inside sidebar */}
        <div className="p-4 border-t border-slate-700/50 flex flex-col gap-3 bg-[#0f172a]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 shrink-0 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                {currentUser?.name ? currentUser.name.substring(0, 2) : "US"}
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-[10px] text-white tracking-wider uppercase leading-none truncate max-w-[110px]" title={currentUser?.name}>
                  {currentUser?.name || "User"}
                </p>
                <p className="text-[9px] text-blue-400 font-bold truncate max-w-[110px]" title={currentUser?.role}>
                  {currentUser?.role || "Operator"}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-400" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            KELUAR SISTEM
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar header */}
        <header className="h-16 bg-white border-b border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Site / Menu</span>
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-tight">
              {activeMenu === "dashboard" && "Dashboard Analytics"}
              {activeMenu === "pnl" && "Profit & Loss Statement"}
              {activeMenu === "data" && "Spreadsheet Tab View"}
              {activeMenu === "upload" && "CSV Data Importer"}
              {activeMenu === "gas" && "Google Apps Script Export"}
              {activeMenu === "users" && "Manajemen Pengguna & Otorisasi"}
            </h2>
          </div>

          {/* Filters in Header bar */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Petunjuk Penggunaan Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400 transition cursor-pointer"
              title="Buka Petunjuk Penggunaan"
            >
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">Petunjuk Penggunaan</span>
              <span className="md:hidden">Petunjuk</span>
            </button>

            {/* Jobsite Filter */}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={jobsite}
                onChange={e => setJobsite(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {jobsites.map(site => (
                  <option key={site} value={site}>{site === "ALL" ? "Semua Lokasi (ALL)" : site}</option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="2026">Tahun 2026</option>
                <option value="ALL">Semua Tahun</option>
              </select>
            </div>
          </div>
        </header>

        {/* View content container */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveView()}
          </motion.div>
        </main>

        {/* Status Bar */}
        <footer className="h-8 bg-white border-t border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 px-6 flex items-center justify-between text-[10px] font-medium text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              DATABASE CONNECTED (Sheets & SQLite)
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-zinc-700">|</span>
            <span className="hidden sm:inline">LAST UPDATE: {new Date().toLocaleDateString("id-ID")} {new Date().toLocaleTimeString("id-ID")}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-bold hidden md:inline">● SYSTEM READY & OPTIMIZED</span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span>VERSION 2.4.0 (STABLE)</span>
          </div>
        </footer>
      </div>

      {/* User Guide Modal Popup */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );

  function activeSubTabMatchesDataTab() {
    return activeMenu === "data";
  }

  function selectedIsUpload() {
    return activeMenu === "upload";
  }

  function selectedIsGAS() {
    return activeMenu === "gas";
  }

  function setActiveSubTab(tab: MenuKey) {
    setActiveMenu(tab);
  }
}
