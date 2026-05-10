import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  LogIn,
  Building2,
  BookOpen,
  Receipt,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import authService from "../../services/authService";
import authStore from "../../store/authStore";

const LoginPage = () => {
  const navigate = useNavigate();

  // Jika sudah login, redirect langsung ke dashboard sesuai role
  const isLoggedIn = authStore.isLoggedIn();
  const currentRole = authStore.getRole();
  if (isLoggedIn) {
    if (currentRole === "manager") {
      return <Navigate to="/manager/dashboard" replace />;
    }
    return <Navigate to="/fo/dashboard" replace />;
  }

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  // Validasi form sebelum submit
  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email tidak boleh kosong.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid.";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password tidak boleh kosong.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Mutation TanStack Query untuk proses login
  const loginMutation = useMutation({
    mutationFn: () => authService.login(email, password),
    onSuccess: (data) => {
      const { token, user } = data.data ?? data;

      // Simpan ke localStorage
      authStore.login(token, user);

      toast.success(`Selamat datang, ${user.name}!`);

      // Redirect berdasarkan role
      if (user.role === "manager") {
        navigate("/manager/dashboard", { replace: true });
      } else {
        navigate("/fo/dashboard", { replace: true });
      }
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        "Login gagal. Periksa email dan password Anda.";
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      loginMutation.mutate();
    }
  };

  const isLoading = loginMutation.isPending;

  // Daftar fitur untuk tampilan sisi kiri
  const features = [
    { icon: BookOpen, label: "KAS Harian Digital" },
    { icon: Receipt, label: "Pengeluaran & Approval" },
    { icon: Building2, label: "Reservasi OTT" },
    { icon: TrendingUp, label: "Laporan Bulanan" },
    { icon: Users, label: "Absensi & Penggajian" },
    { icon: ShieldCheck, label: "Shift Report & Handover" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ============================================ */}
      {/* SISI KIRI — Branding & Ilustrasi             */}
      {/* ============================================ */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1F3864 0%, #2E74B5 60%, #3a8fd4 100%)",
        }}
      >
        {/* Dekorasi lingkaran background */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.3)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.2)" }}
        />

        {/* Logo / Header kiri */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-lg font-bold tracking-wide">
              Hotel Puri Asih
            </span>
          </div>
        </div>

        {/* Konten tengah kiri */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
            Puri Asih
            <br />
            <span className="text-blue-200">Cashbook</span>
          </h1>
          <p className="text-blue-100 text-base mb-10 leading-relaxed">
            Sistem Pembukuan Digital Hotel Puri Asih. <br />
            Kelola keuangan hotel dengan lebih mudah, cepat, dan akurat.
          </p>

          {/* Grid fitur */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white bg-opacity-10 rounded-xl px-4 py-3 border border-white border-opacity-10 backdrop-blur-sm"
              >
                <Icon className="w-4 h-4 text-blue-200 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer kiri */}
        <div className="relative z-10">
          <p className="text-blue-200 text-xs opacity-70">
            &copy; {new Date().getFullYear()} Hotel Puri Asih. All rights reserved.
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* SISI KANAN — Form Login                      */}
      {/* ============================================ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header form */}
          <div className="text-center mb-10">
            {/* Logo mobile (hanya tampil di mobile) */}
            <div className="lg:hidden flex justify-center mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1F3864, #2E74B5)" }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <p
              className="text-xs font-semibold tracking-[0.2em] uppercase mb-1"
              style={{ color: "#2E74B5" }}
            >
              PURI ASIH
            </p>
            <p className="text-gray-400 text-sm mb-6">Hotel Management System</p>

            <h2 className="text-3xl font-bold text-gray-800">Sign In</h2>
            <p className="text-gray-500 text-sm mt-2">
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Input Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Masukkan email anda"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 bg-white placeholder-gray-400 outline-none transition-all duration-200
                  ${
                    errors.email
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password anda"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((p) => ({ ...p, password: "" }));
                  }}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm text-gray-800 bg-white placeholder-gray-400 outline-none transition-all duration-200
                    ${
                      errors.password
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed`}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Tombol Sign In */}
            <button
              id="btn-login"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 mt-2
                disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "#5a9fd4"
                  : "linear-gradient(135deg, #1F3864, #2E74B5)",
                boxShadow: isLoading ? "none" : "0 4px 15px rgba(46, 116, 181, 0.4)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.opacity = "1";
              }}
            >
              {isLoading ? (
                <>
                  <span
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer form */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Lupa password?{" "}
            <span className="font-medium" style={{ color: "#2E74B5" }}>
              Hubungi Manager jika lupa password.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
