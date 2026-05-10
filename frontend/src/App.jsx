import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Layouts
import { FoLayout } from "./components/layout/FoLayout";
import { ManagerLayout } from "./components/layout/ManagerLayout";

// Protected Route
import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth
import LoginPage from "./pages/auth/LoginPage";

// FO Pages
import FoDashboardPage from "./pages/fo/DashboardPage";
import KasPage from "./pages/fo/KasHarianPage";
import ReservasiPage from "./pages/fo/ReservationPage";
import DepositPage from "./pages/fo/DepositPage";
import PengeluaranPage from "./pages/fo/ExpensesPage";
import AbsensiPage from "./pages/fo/AttendancePage";
import LaporanFoPage from "./pages/fo/ReportPage";
import HandoverPage from "./pages/fo/HandoverPage";

// Manager Pages
import ManagerDashboardPage from "./pages/manager/DashboardPage";
import FoManagementPage from "./pages/manager/FoManagementPage";
import ApprovalPage from "./pages/manager/ApprovalPage";
import LaporanManagerPage from "./pages/manager/ReportPage";
import MonthlyReportPage from "./pages/manager/MonthlyReportPage";
import PenggajianPage from "./pages/manager/PayrollPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Root → redirect ke login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Halaman Login (Public) */}
          <Route path="/login" element={<LoginPage />} />

          {/* ====================== */}
          {/* FO Routes (Protected)  */}
          {/* ====================== */}
          <Route
            path="/fo"
            element={
              <ProtectedRoute role="fo">
                <FoLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/fo/dashboard" replace />} />
            <Route path="dashboard"   element={<FoDashboardPage />} />
            <Route path="kas"         element={<KasPage />} />
            <Route path="reservasi"   element={<ReservasiPage />} />
            <Route path="deposit"     element={<DepositPage />} />
            <Route path="pengeluaran" element={<PengeluaranPage />} />
            <Route path="absensi"     element={<AbsensiPage />} />
            <Route path="laporan"     element={<LaporanFoPage />} />
            <Route path="handover"    element={<HandoverPage />} />
          </Route>

          {/* ========================== */}
          {/* Manager Routes (Protected) */}
          {/* ========================== */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute role="manager">
                <ManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard"      element={<ManagerDashboardPage />} />
            <Route path="fo-management"  element={<FoManagementPage />} />
            <Route path="approval"       element={<ApprovalPage />} />
            <Route path="laporan"        element={<LaporanManagerPage />} />
            <Route path="monthly-report" element={<MonthlyReportPage />} />
            <Route path="penggajian"     element={<PenggajianPage />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "14px" },
          success: { iconTheme: { primary: "#2563eb", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;
