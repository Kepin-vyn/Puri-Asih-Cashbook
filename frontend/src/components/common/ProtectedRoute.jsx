import { Navigate } from "react-router-dom";
import authStore from "../../store/authStore";

/**
 * ProtectedRoute — proteksi berdasarkan login status dan role
 *
 * Props:
 *   children  → komponen yang dilindungi
 *   role      → 'fo' | 'manager' — role yang diizinkan masuk
 */
const ProtectedRoute = ({ children, role }) => {
  const isLoggedIn = authStore.isLoggedIn();
  const userRole = authStore.getRole();

  // Belum login → redirect ke halaman login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
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
