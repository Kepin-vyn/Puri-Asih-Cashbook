import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import authService from "../../services/authService";
import authStore from "../../store/authStore";

const LoginPage = () => {
  const navigate = useNavigate();

  // ── Hooks harus dipanggil SEBELUM early return ──
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({ email: "", password: "" });

  const loginMutation = useMutation({
    mutationFn: () => authService.login(email, password),
    onSuccess: (data) => {
      const { token, user } = data.data ?? data;
      authStore.login(token, user);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate(user.role === "manager" ? "/manager/dashboard" : "/fo/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Login gagal. Periksa email dan password Anda.");
    },
  });

  // Early return SETELAH semua hooks
  const isLoggedIn = authStore.isLoggedIn();
  const currentRole = authStore.getRole();
  if (isLoggedIn) {
    return <Navigate to={currentRole === "manager" ? "/manager/dashboard" : "/fo/dashboard"} replace />;
  }

  const validate = () => {
    const e = { email: "", password: "" };
    let ok = true;
    if (!email.trim()) { e.email = "Email tidak boleh kosong."; ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { e.email = "Format email tidak valid."; ok = false; }
    if (!password.trim()) { e.password = "Password tidak boleh kosong."; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) loginMutation.mutate();
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* ── Kiri: Branding ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 bg-[#171717]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
            <span className="text-black text-[11px] font-[700]">PA</span>
          </div>
          <span className="text-white text-[14px] font-[600]"
                style={{ fontFamily: "var(--font-display)" }}>
            Hotel Puri Asih
          </span>
        </div>

        <div>
          <h1 className="text-white text-[30px] font-[500] leading-[1.2] mb-4"
              style={{ fontFamily: "var(--font-display)" }}>
            Puri Asih<br />Cashbook
          </h1>
          <p className="text-[rgba(255,255,255,0.7)] text-[14px] leading-[1.6] mb-8">
            Sistem Pembukuan Digital Hotel Puri Asih. Kelola keuangan hotel dengan lebih mudah dan akurat.
          </p>
          <ul className="space-y-2.5">
            {[
              "KAS Harian Digital",
              "Pengeluaran & Approval",
              "Reservasi OTT",
              "Laporan Bulanan",
              "Absensi & Penggajian",
              "Shift Report & Handover",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[rgba(255,255,255,0.7)] text-[14px]">
                <span className="text-white">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[rgba(255,255,255,0.4)] text-[12px]">
          © {new Date().getFullYear()} Hotel Puri Asih
        </p>
      </div>

      {/* ── Kanan: Form ── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-[11px] font-[700]">PA</span>
            </div>
            <span className="text-black text-[14px] font-[600]"
                  style={{ fontFamily: "var(--font-display)" }}>
              Hotel Puri Asih
            </span>
          </div>

          <h2 className="text-[24px] font-[600] text-black mb-1"
              style={{ fontFamily: "var(--font-display)" }}>
            Sign In
          </h2>
          <p className="text-[14px] text-[#737373] mb-8">
            Masukkan kredensial Anda untuk melanjutkan
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[14px] font-[500] text-black mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="email@puriasih.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); }}
                disabled={isLoading}
                className="w-full h-10 px-4 rounded-full border border-[#e5e5e5] text-[16px] bg-white placeholder-[#a3a3a3] focus:border-black focus:outline-none transition-colors disabled:opacity-60"
              />
              {errors.email && <p className="mt-1 text-[13px] text-[#b91c1c]">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[14px] font-[500] text-black mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password Anda"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: "" })); }}
                  disabled={isLoading}
                  className="w-full h-10 px-4 pr-10 rounded-full border border-[#e5e5e5] text-[16px] bg-white placeholder-[#a3a3a3] focus:border-black focus:outline-none transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-black transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[13px] text-[#b91c1c]">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="w-full h-9 px-5 rounded-full bg-black text-white text-[14px] font-[500] hover:bg-[#090909] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#a3a3a3] mt-8">
            Lupa password?{" "}
            <span className="text-black font-[500]">Hubungi Manager.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
