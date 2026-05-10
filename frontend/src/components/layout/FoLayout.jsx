import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Receipt,
  ShoppingBag,
  ClipboardCheck,
  FileText,
  ArrowLeftRight,
  LogOut,
  Hotel,
} from "lucide-react";
import authStore from "../../store/authStore";

const navItems = [
  { to: "/fo/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { to: "/fo/reservasi",   label: "Reservation",  icon: CalendarCheck },
  { to: "/fo/deposit",     label: "Deposit",      icon: Wallet },
  { to: "/fo/kas",         label: "Cash Income",  icon: Receipt },
  { to: "/fo/pengeluaran", label: "Expenses",     icon: ShoppingBag },
  { to: "/fo/absensi",     label: "Attendance",   icon: ClipboardCheck },
  { to: "/fo/laporan",     label: "Report",       icon: FileText },
  { to: "/fo/handover",    label: "Handover",     icon: ArrowLeftRight },
];

export const FoLayout = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

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
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Hotel size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">Puri Asih</p>
            <p className="text-xs text-gray-400">Front Office</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
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
            <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Front Office"}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.shift ?? "Shift"}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() ?? "F"}
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
