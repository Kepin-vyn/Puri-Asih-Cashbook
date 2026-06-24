import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CheckSquare, Layers, FileDown, LogOut,
} from "lucide-react";
import authStore from "../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import expenseService from "../../services/expenseService";

const navItems = [
  { to: "/manager/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { to: "/manager/fo-management",  label: "FO Management",  icon: Users },
  { to: "/manager/approval",       label: "Approval",       icon: CheckSquare, showBadge: true },
  { to: "/manager/monthly-report", label: "Monthly Report", icon: Layers },
  { to: "/manager/penggajian",     label: "Payroll",        icon: FileDown },
];

export const ManagerLayout = () => {
  const navigate = useNavigate();
  const user = authStore.getUser();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-approval-count"],
    queryFn: async () => {
      try {
        const res = await expenseService.getAll({ status: "pending", per_page: 1 });
        return res?.meta?.total ?? 0;
      } catch { return 0; }
    },
    refetchInterval: 30000,
  });

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
            <p className="text-[11px] text-[#a3a3a3]">Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, showBadge }) => (
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
              <span className="flex-1">{label}</span>
              {showBadge && pendingCount > 0 && (
                <span className="bg-black text-white text-[10px] font-[600] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t border-[#e5e5e5] space-y-0.5">
          <div className="px-3 py-2">
            <p className="text-[13px] font-[500] text-black truncate">{user?.name ?? "Manager"}</p>
            <p className="text-[11px] text-[#a3a3a3]">Manager</p>
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
