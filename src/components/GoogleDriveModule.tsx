import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  Search, 
  FileText, 
  FileJson, 
  FolderPlus, 
  FolderOpen, 
  Database, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from "lucide-react";
import Swal from "sweetalert2";
import { googleSignIn, googleLogout, initGoogleAuth } from "../lib/googleAuth";
import { User } from "firebase/auth";

interface GoogleDriveModuleProps {
  currentUser: any;
}

export default function GoogleDriveModule({ currentUser }: GoogleDriveModuleProps) {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  // Initialize Auth State on Mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        fetchFiles(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        Swal.fire({
          icon: "success",
          title: "Terhubung!",
          text: "Berhasil menghubungkan aplikasi dengan Google Drive Anda.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchFiles(result.accessToken);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Koneksi Gagal",
        text: err.message || "Gagal menghubungkan Google Drive.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setAccessToken(null);
      setFiles([]);
      Swal.fire({
        icon: "success",
        title: "Terputus",
        text: "Koneksi Google Drive berhasil diputuskan.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Fetch Files from Google Drive
  const fetchFiles = async (token = accessToken) => {
    if (!token) return;
    setRefreshing(true);
    try {
      // Find or create 'PCC-BIMA_Backups' folder first to organize files
      let folderId = appFolderId;
      if (!folderId) {
        folderId = await getOrCreateAppFolder(token);
      }

      // Fetch files inside the folder and in the general drive (filtered)
      let url = "https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,size,createdTime)&orderBy=createdTime desc";
      if (folderId) {
        url += `&q='${folderId}' in parents and trashed = false`;
      } else {
        url += `&q=name contains 'pcc_bima' and trashed = false`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Gagal mengambil file dari Google Drive:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Get or Create PCC-BIMA Backups folder
  const getOrCreateAppFolder = async (token: string): Promise<string | null> => {
    try {
      // Search for folder
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='PCC-BIMA_Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        const id = searchData.files[0].id;
        setAppFolderId(id);
        return id;
      }

      // Create new folder
      const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "PCC-BIMA_Backups",
          mimeType: "application/vnd.google-apps.folder"
        })
      });
      const createData = await createRes.json();
      if (createData.id) {
        setAppFolderId(createData.id);
        return createData.id;
      }
    } catch (err) {
      console.error("Error creating/finding backups folder:", err);
    }
    return null;
  };

  // 1. BACKUP DATABASE TO GOOGLE DRIVE
  const handleBackup = async () => {
    if (!accessToken) return;
    
    // Confirm first
    const confirm = await Swal.fire({
      title: "Backup Database",
      text: "Anda akan mengekspor database ERP PCC-BIMA saat ini dan menyimpannya di Google Drive.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#475569",
      confirmButtonText: "Ya, Backup Sekarang",
      cancelButtonText: "Batal"
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      // 1. Fetch current database state from Server API
      const dbRes = await fetch("/api/data-all/export");
      if (!dbRes.ok) throw new Error("Gagal mengambil database dari server.");
      const dbContent = await dbRes.json();

      // 2. Format backup name
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `pcc_bima_backup_${dateStr}.json`;

      // 3. Get backups folder ID
      const folderId = appFolderId || await getOrCreateAppFolder(accessToken);

      // 4. Upload file to Google Drive
      const metadata = {
        name: fileName,
        mimeType: "application/json",
        parents: folderId ? [folderId] : undefined
      };

      const fileContent = JSON.stringify(dbContent, null, 2);
      const boundary = "foo_bar_boundary";
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Google Drive upload failed: ${errorText}`);
      }

      await Swal.fire({
        icon: "success",
        title: "Backup Berhasil!",
        text: `File ${fileName} disimpan di folder PCC-BIMA_Backups.`,
        confirmButtonColor: "#2563eb"
      });

      fetchFiles(accessToken);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Backup Gagal",
        text: err.message || "Terjadi kesalahan saat mem-backup data."
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. RESTORE DATABASE FROM GOOGLE DRIVE (DESTRUCTIVE OPERATION)
  const handleRestore = async (fileId: string, fileName: string) => {
    if (!accessToken) return;

    // Strict Double Confirmation for destructive operation
    const confirm1 = await Swal.fire({
      title: "PERINGATAN RESTORE!",
      html: `<p class="text-red-500 font-bold mb-2">Tindakan ini akan menimpa seluruh database PCC-BIMA dengan file backup ini!</p>
             <p class="text-xs text-slate-500">File: <strong>${fileName}</strong></p>
             <p class="text-xs text-slate-500">Seluruh data inputan harian baru yang belum dibackup akan hilang selamanya.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      confirmButtonText: "Ya, Timpa Database",
      cancelButtonText: "Batal"
    });

    if (!confirm1.isConfirmed) return;

    const confirm2 = await Swal.fire({
      title: "Verifikasi Terakhir",
      text: "Ketik 'RESTORE' di bawah ini untuk mengonfirmasi pemulihan penuh database.",
      input: "text",
      inputPlaceholder: "Ketik RESTORE",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      confirmButtonText: "Proses Pemulihan",
      cancelButtonText: "Batal",
      preConfirm: (value) => {
        if (value !== "RESTORE") {
          Swal.showValidationMessage("Anda harus mengetik 'RESTORE' dengan benar!");
        }
        return value;
      }
    });

    if (!confirm2.isConfirmed) return;

    setLoading(true);
    try {
      // 1. Download file content from Google Drive
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!downloadRes.ok) throw new Error("Gagal mengunduh file backup dari Google Drive.");
      const backupDb = await downloadRes.json();

      // 2. Send restore payload to Server API
      const restoreRes = await fetch("/api/data-all/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbContent: backupDb })
      });

      const restoreData = await restoreRes.json();
      if (!restoreRes.ok) {
        throw new Error(restoreData.error || "Gagal merestore database ke server.");
      }

      await Swal.fire({
        icon: "success",
        title: "Pemulihan Berhasil!",
        text: "Database sistem telah berhasil direstore sepenuhnya ke versi cadangan.",
        confirmButtonColor: "#2563eb"
      });

      // Reload the entire page to let React fetch fresh database state
      window.location.reload();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Pemulihan Gagal",
        text: err.message || "Terjadi kesalahan saat memulihkan database."
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. DELETE FILE FROM GOOGLE DRIVE (DESTRUCTIVE OPERATION)
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!accessToken) return;

    const confirm = await Swal.fire({
      title: "Hapus File Cadangan?",
      html: `Anda akan menghapus file <strong>${fileName}</strong> dari Google Drive Anda.<br/><span class="text-xs text-red-500 font-bold">Tindakan ini permanen dan tidak dapat dibatalkan.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      confirmButtonText: "Hapus Permanen",
      cancelButtonText: "Batal"
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) throw new Error("Gagal menghapus file dari Google Drive.");

      Swal.fire({
        icon: "success",
        title: "Berhasil Dihapus",
        text: "File cadangan telah dihapus dari Google Drive.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchFiles(accessToken);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: err.message || "Gagal menghapus file cadangan."
      });
    } finally {
      setLoading(false);
    }
  };

  // File search filter
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="google-drive-panel">
      {/* Tab Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-500" />
            Integrasi Google Drive
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simpan cadangan database secara instan dan pulihkan data kapan saja menggunakan penyimpanan awan Google Drive aman Anda.
          </p>
        </div>

        {/* Google Authentication States */}
        <div>
          {!googleUser ? (
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-500/20 cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sambungkan ke Google Drive
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{googleUser.displayName}</p>
                <p className="text-[10px] text-slate-500">{googleUser.email}</p>
              </div>
              {googleUser.photoURL && (
                <img 
                  src={googleUser.photoURL} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full border border-blue-500/40"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={handleSignOut}
                className="p-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-400 rounded-lg cursor-pointer transition"
                title="Putuskan Hubungan"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {googleUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Quick Action Cloud Database Utility */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Database className="h-5 w-5 text-indigo-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Utilitas Cadangan Data</h3>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Sistem Cloud Aktif</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Direktori Google Drive terdeteksi. Folder penyimpanan <code className="text-blue-400 bg-slate-950 px-1 rounded">PCC-BIMA_Backups</code> telah dikonfigurasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg transition shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4" />
                  MULAILAH CADANGAN DATABASE
                </button>

                <div className="text-[10px] text-slate-500 leading-relaxed text-center px-2">
                  Backup akan mengekspor seluruh tabel master dan harian (LOGPRODUKSI, PTY, SALES, COST, dll) ke dalam berkas tunggal JSON yang terenkripsi aman di cloud Anda.
                </div>
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Petunjuk Penting</h3>
              </div>
              <ul className="space-y-2.5 text-[11px] text-slate-400 leading-relaxed list-disc list-inside">
                <li>Selalu lakukan <strong>Backup</strong> sebelum mengimpor file CSV berukuran besar.</li>
                <li>Operasi <strong>Restore</strong> akan mengembalikan kondisi seluruh sistem persis seperti tanggal backup dibuat.</li>
                <li>Gunakan kolom pencarian di panel kanan untuk menyaring backup tertentu.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Drive Files Backup Explorer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Berkas Cadangan Google Drive</h3>
                    <p className="text-[10px] text-slate-500">Mencantumkan berkas backup JSON yang tersimpan</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Cari cadangan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => fetchFiles()}
                    disabled={refreshing}
                    className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition disabled:opacity-50"
                    title="Segarkan Berkas"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Backups List */}
              {refreshing && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-500 font-semibold">Menghubungkan ke direktori Google Drive...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-lg p-6 bg-slate-950/30">
                  <FolderPlus className="h-10 w-10 text-slate-700 mb-2" />
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Belum Ada File Backup</h4>
                  <p className="text-[10px] text-slate-600 max-w-sm mt-1">
                    Silakan klik tombol <strong>Mulailah Cadangan Database</strong> di panel kiri untuk membuat file cadangan sistem pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-800 rounded-lg divide-y divide-slate-800 bg-slate-950/20">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 rounded-lg shrink-0">
                          <FileJson className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1">
                            <span>Ukuran: {file.size ? `${(parseInt(file.size)/1024).toFixed(2)} KB` : "N/A"}</span>
                            <span>•</span>
                            <span>Dibuat: {new Date(file.createdTime).toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Operation Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRestore(file.id, file.name)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600 border border-amber-600/30 hover:border-amber-500 text-amber-400 hover:text-white font-extrabold text-[10px] rounded cursor-pointer transition disabled:opacity-50"
                          title="Restore database dari backup ini"
                        >
                          <CloudDownload className="h-3.5 w-3.5" />
                          <span>RESTORE</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          disabled={loading}
                          className="p-1.5 bg-red-650/10 hover:bg-red-650 border border-red-650/30 text-red-400 hover:text-white rounded cursor-pointer transition"
                          title="Hapus cadangan dari Google Drive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED PROMPT SCREEN */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-2xl mx-auto space-y-6 shadow-2xl shadow-blue-950/10">
          <div className="w-16 h-16 bg-blue-950/50 border border-blue-900/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-xl shadow-blue-950/20">
            <Cloud className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Koneksikan dengan Google Drive</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Mulai sinkronisasi aman database ERP PCC-BIMA ke penyimpanan awan pribadi Anda. Nikmati pencadangan data otomatis satu klik dan pemulihan data instan.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-lg shadow-xl shadow-blue-600/20 cursor-pointer transition mx-auto disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sambungkan Akun Google Anda
          </button>

          <div className="pt-4 border-t border-slate-800/60 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">100% Aman</span>
              <span className="text-[10px] text-slate-500 block">Autentikasi resmi Google OAuth</span>
            </div>
            <div className="space-y-1 border-x border-slate-800/60">
              <span className="text-xs font-bold text-white block">Instan Backup</span>
              <span className="text-[10px] text-slate-500 block">Satu klik ekspor data harian</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Penuh Kontrol</span>
              <span className="text-[10px] text-slate-500 block">Kelola berkas secara mandiri</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
