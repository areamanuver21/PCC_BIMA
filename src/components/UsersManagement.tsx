import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, User as UserIcon, Lock, RefreshCw, Key } from "lucide-react";
import { User } from "../types";
import Swal from "sweetalert2";

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Operator");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!username.trim() || !name.trim() || !password.trim()) {
      setFormError("Semua field wajib diisi!");
      return;
    }

    if (password.length < 5) {
      setFormError("Password minimal harus 5 karakter!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          name: name.trim(),
          role,
          password: password.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Sukses!",
          text: `User ${data.username} berhasil didaftarkan!`,
          icon: "success",
          confirmButtonColor: "#2563eb"
        });
        // Reset form
        setUsername("");
        setName("");
        setPassword("");
        setRole("Operator");
        fetchUsers();
      } else {
        setFormError(data.error || "Gagal menambahkan user.");
      }
    } catch (err) {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, usernameToDelete: string) => {
    if (usernameToDelete === "admin") {
      Swal.fire({
        title: "Peringatan",
        text: "User admin default tidak bisa dihapus!",
        icon: "warning",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: `User ${usernameToDelete} akan dihapus secara permanen dari sistem!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          Swal.fire({
            title: "Dihapus!",
            text: "User berhasil dihapus.",
            icon: "success",
            confirmButtonColor: "#2563eb"
          });
          fetchUsers();
        } else {
          Swal.fire("Gagal", data.error || "Gagal menghapus user.", "error");
        }
      } catch (err) {
        Swal.fire("Gagal", "Kesalahan koneksi.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">Manajemen Pengguna</h3>
          <p className="text-xs text-slate-400 font-medium">
            Tambah, hapus, dan kelola otorisasi akses pengguna aplikasi PCC-BIMA Cost Control
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          REFRESH LIST
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Tambah Pengguna */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 self-start">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-zinc-800">
            <UserPlus className="h-4.5 w-4.5 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Tambah Pengguna Baru</h4>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-medium border border-red-100 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-400">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: ryan_bima"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Contoh: Ryan Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Peran / Jabatan (Role)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="Operator">Operator (Akses Input & Excel)</option>
                <option value="Viewer">Viewer (Hanya Lihat Laporan)</option>
                <option value="Administrator">Administrator (Akses Penuh)</option>
                <option value="Manager">Manager / Direktur</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="Minimal 5 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-white py-2 text-xs font-bold shadow-lg shadow-blue-600/10 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "MEMPROSES..." : "DAFTARKAN PENGGUNA"}
            </button>
          </form>
        </div>

        {/* Daftar Pengguna Aktif */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-zinc-800">
            <Shield className="h-4.5 w-4.5 text-indigo-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Daftar Pengguna Aktif ({users.length})</h4>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <UserIcon className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Belum ada pengguna terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-850">
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengguna</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</th>
                    <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/10">
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                            {user.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className="font-mono text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800">
                          {user.username}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.role === "Administrator"
                            ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20"
                            : user.role === "Operator"
                            ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20"
                            : "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-zinc-850"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {user.username === "admin" ? (
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-50 dark:bg-zinc-800 rounded">
                            SYSTEM KEY
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
