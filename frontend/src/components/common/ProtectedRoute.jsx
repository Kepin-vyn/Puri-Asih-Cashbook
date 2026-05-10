import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import authStore from "../../store/authStore";

/**
 * ProtectedRoute — proteksi berdasarkan login status dan role
 *
 * Props:
 *   children  → komponen yang dilindungi
 *   role      → 'fo' | 'manager' — role yang diizinkan masuk
 */
const ProtectedRoute = ({ children, role }) => {
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Simulasi pengecekan token (sync, tapi dibungkus agar
    // ada loading state yang terlihat alami)
    const timer = setTimeout(() => setIsChecking(false), 150);
    return () => clearTimeout(timer);
  }, []);

  // Tampilkan loading spinner saat sedang validasi token
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#2E74B5", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-500 font-medium">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = authStore.isLoggedIn();
  const userRole = authStore.getRole();

  // Belum login → redirect ke halaman login, simpan halaman tujuan asal
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Login tapi akses halaman role yang salah → redirect ke dashboard sesuai role
  if (role && userRole !== role) {
    if (userRole === "manager") {
      return <Navigate to="/manager/dashboard" replace />;
    }
    return <Navigate to="/fo/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
