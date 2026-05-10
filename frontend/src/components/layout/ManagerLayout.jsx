import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BarChart2,
  Layers,
  FileDown,
  Settings,
  ScrollText,
  LogOut,
  Hotel,
} from "lucide-react";
import authStore from "../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "../../utils/axios";

const navItems = [
  { to: "/manager/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { to: "/manager/fo-management", label: "FO Management",  icon: Users },
  { to: "/manager/approval",      label: "Approval",       icon: CheckSquare, showBadge: true },
  { to: "/manager/laporan",       label: "Report",         icon: BarChart2 },
  { to: "/manager/monthly-report",label: "Monthly Report", icon: Layers },
  { to: "/manager/penggajian",    label: "Payroll",        icon: FileDown },
];

export const ManagerLayout = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

  // Fetch jumlah pending approval (akan diisi di Issue #8)
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn: async () => {
      try {
        const res = await api.get("/expenses?status=pending&per_page=1");
        return res.data?.meta?.total ?? 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 30000, // refresh setiap 30 detik
  });

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 bg-white shadow-lg flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Hotel size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">Puri Asih</p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, showBadge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {showBadge && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Manager"}</p>
            <p className="text-xs text-gray-400">Manager</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() ?? "M"}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
