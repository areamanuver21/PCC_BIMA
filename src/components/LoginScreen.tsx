import React, { useState } from "react";
import { User, Lock, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";
import BimaLogo from "./BimaLogo";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Selamat datang, ${data.user.name}!`,
          showConfirmButton: false,
          timer: 2000
        });
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Gagal masuk. Silakan coba lagi.");
      }
    } catch (err) {
      setError("Terjadi masalah koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  const showDemoAccountInfo = () => {
    Swal.fire({
      title: "Akun Demo Default",
      html: `
        <div class="text-left space-y-3 text-sm">
          <p class="font-medium text-slate-600">Anda dapat menggunakan akun default berikut:</p>
          <div class="bg-slate-50 p-3 rounded-lg border font-mono text-xs">
            <p><strong>1. Administrator:</strong></p>
            <p>Username: <span class="text-blue-600">admin</span></p>
            <p>Password: <span class="text-blue-600">admin123</span></p>
            <hr class="my-2" />
            <p><strong>2. Operator:</strong></p>
            <p>Username: <span class="text-amber-600">bima</span></p>
            <p>Password: <span class="text-amber-600">bima123</span></p>
          </div>
          <p class="text-xs text-slate-400 mt-2">* Setelah masuk, Administrator dapat mendaftarkan pengguna baru.</p>
        </div>
      `,
      icon: "info",
      confirmButtonColor: "#2563eb",
      confirmButtonText: "Mengerti"
    });
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0f172a] font-sans text-slate-200 relative overflow-hidden">
      {/* Visual background layers */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0b0f19] z-0"></div>
      
      {/* Decorative Coal Shape Outline in Bg */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>

      <div className="relative w-full max-w-md p-6 z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-blue-950/20">
          
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-56 bg-white rounded-xl flex flex-col items-center justify-center p-3 shadow-xl shadow-blue-950/40 mb-4">
              <BimaLogo className="h-14 w-auto" showText={true} />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase">PCC-BIMA ERP</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Mine Cost Control & Analytics</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-950/40 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-lg font-semibold text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-3 text-xs font-extrabold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "MENCOCOKKAN..." : "MASUK KE SISTEM"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Helper demo button */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Secure Authentication
            </span>
            <button
              onClick={showDemoAccountInfo}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Akun Default?
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
