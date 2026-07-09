import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarCheck, Wallet, Receipt,
  ShoppingBag, ClipboardCheck, FileText, ArrowLeftRight, LogOut,
} from "lucide-react";
import authStore from "../../store/authStore";

const navItems = [
  { to: "/fo/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/fo/reservasi",   label: "Reservation", icon: CalendarCheck },
  { to: "/fo/deposit",     label: "Deposit",     icon: Wallet },
  { to: "/fo/kas",         label: "Cash Income", icon: Receipt },
  { to: "/fo/pengeluaran", label: "Expenses",    icon: ShoppingBag },
  { to: "/fo/absensi",     label: "Attendance",  icon: ClipboardCheck },
  { to: "/fo/laporan",     label: "Report",      icon: FileText },
  { to: "/fo/handover",    label: "Handover",    icon: ArrowLeftRight },
];

export const FoLayout = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex flex-col w-56 border-r border-[#e5e5e5] flex-shrink-0 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#e5e5e5]">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-[11px] font-[600]">PA</span>
          </div>
          <div>
            <p className="text-[13px] font-[600] text-black leading-tight"
               style={{ fontFamily: "var(--font-display)" }}>
              Puri Asih
            </p>
            <p className="text-[11px] text-[#a3a3a3]">Front Office</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-full text-[13px] font-[500] transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-[#525252] hover:bg-[#fafafa] hover:text-black"
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t border-[#e5e5e5] space-y-0.5">
          <div className="px-3 py-2">
            <p className="text-[13px] font-[500] text-black truncate">{user?.name ?? "Front Office"}</p>
            <p className="text-[11px] text-[#a3a3a3] capitalize">{user?.shift ?? "Shift"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-full text-[13px] font-[500] text-[#737373] hover:bg-[#fafafa] hover:text-black transition-colors"
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
