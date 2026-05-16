import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Eye, UserX, X, Users, UserCheck, UserMinus, ChevronLeft, ChevronRight, Save,
} from "lucide-react";
import toast from "react-hot-toast";
import userService from "../../services/userService";
import shiftScheduleService from "../../services/shiftScheduleService";
import ConfirmModal from "../../components/ui/ConfirmModal";
import InlineDropdown from "../../components/ui/InlineDropdown";
import { formatDate } from "../../utils/dateFormatter";

// ── Constants ─────────────────────────────────────────────────────────────────
const SHIFT_OPTIONS = [
  { value: "pagi",  label: "Pagi" },
  { value: "siang", label: "Siang" },
  { value: "malam", label: "Malam" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${
    status === "active"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : "bg-red-100 text-red-700 ring-red-200"
  }`}>
    {status === "active" ? "Active" : "Inactive"}
  </span>
);

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name:                  "",
  email:                 "",
  password:              "",
  password_confirmation: "",
  shift:                 "pagi",
});

// ── Week helpers ──────────────────────────────────────────────────────────────
const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const SCHEDULE_OPTIONS = [
  { value: "pagi",  label: "🌅 Pagi" },
  { value: "siang", label: "🌤 Siang" },
  { value: "malam", label: "🌙 Malam" },
  { value: "off",   label: "🔴 Off" },
];

/** Hitung Senin dari tanggal manapun */
const getMondayOf = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const toDateStr = (date) => date.toISOString().split("T")[0];

const formatDayHeader = (date) => {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ── WeeklyScheduleTab ─────────────────────────────────────────────────────────
const WeeklyScheduleTab = () => {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [localSchedule, setLocalSchedule] = useState({});
  const [saving, setSaving] = useState(false);

  const weekStartStr = toDateStr(weekStart);
  const weekEndStr   = toDateStr(addDays(weekStart, 6));

  // Fetch jadwal minggu ini
  const { data, isLoading } = useQuery({
    queryKey: ["shift-schedule-week", weekStartStr],
    queryFn:  () => shiftScheduleService.getWeek(weekStartStr),
    onSuccess: () => setLocalSchedule({}), // reset local changes on new week
  });
  const schedules = data?.data ?? [];

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  const handleChange = (userId, dayKey, value) => {
    setLocalSchedule((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [dayKey]: value },
    }));
  };

  const getVal = (row, dayKey) =>
    localSchedule[row.user_id]?.[dayKey] ?? row[dayKey] ?? "off";

  const hasChanges = Object.keys(localSchedule).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    let successCount = 0;
    let errorCount   = 0;

    for (const [userId, changes] of Object.entries(localSchedule)) {
      const row = schedules.find((s) => String(s.user_id) === String(userId));
      if (!row) continue;

      const payload = {
        user_id:         Number(userId),
        week_start_date: weekStartStr,
        monday:    localSchedule[userId]?.monday    ?? row.monday    ?? "off",
        tuesday:   localSchedule[userId]?.tuesday   ?? row.tuesday   ?? "off",
        wednesday: localSchedule[userId]?.wednesday ?? row.wednesday ?? "off",
        thursday:  localSchedule[userId]?.thursday  ?? row.thursday  ?? "off",
        friday:    localSchedule[userId]?.friday    ?? row.friday    ?? "off",
        saturday:  localSchedule[userId]?.saturday  ?? row.saturday  ?? "off",
        sunday:    localSchedule[userId]?.sunday    ?? row.sunday    ?? "off",
      };

      try {
        await shiftScheduleService.store(payload);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSaving(false);
    setLocalSchedule({});
    queryClient.invalidateQueries({ queryKey: ["shift-schedule-week"] });

    if (errorCount === 0) {
      toast.success(`✅ Jadwal ${successCount} staff berhasil disimpan!`);
    } else {
      toast.error(`${errorCount} jadwal gagal disimpan. ${successCount} berhasil.`);
    }
  };

  const weekLabel = `${new Date(weekStart).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} (Sen) — ${new Date(weekEndStr).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} (Min)`;

  return (
    <div className="space-y-4">
      {/* Week picker */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <button
          onClick={prevWeek}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <ChevronLeft size={16} /> Minggu Lalu
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">{weekLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">Klik dropdown untuk ubah jadwal</p>
        </div>
        <button
          onClick={nextWeek}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Minggu Depan <ChevronRight size={16} />
        </button>
      </div>

      {/* Tabel jadwal */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-gray-50">
                Nama FO
              </th>
              {DAY_KEYS.map((_, i) => (
                <th key={i} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap text-center">
                  {DAYS_ID[i]}<br />
                  <span className="font-normal normal-case text-gray-400">
                    {formatDayHeader(addDays(weekStart, i))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  Tidak ada staff FO aktif
                </td>
              </tr>
            ) : (
              schedules.map((row) => {
                const hasLocalChange = !!localSchedule[row.user_id];
                return (
                  <tr key={row.user_id} className={`transition-colors ${hasLocalChange ? "bg-blue-50/40" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap sticky left-0 bg-inherit">
                      {row.user_name}
                      {hasLocalChange && (
                        <span className="ml-2 text-xs text-blue-500 font-normal">• diubah</span>
                      )}
                    </td>
                    {DAY_KEYS.map((dayKey) => (
                      <td key={dayKey} className="px-2 py-2 text-center">
                        <InlineDropdown
                          value={getVal(row, dayKey)}
                          options={SCHEDULE_OPTIONS}
                          onChange={(val) => handleChange(row.user_id, dayKey, val)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tombol Simpan */}
      <div className="flex items-center justify-between">
        {hasChanges ? (
          <p className="text-sm text-blue-600 font-medium">
            {Object.keys(localSchedule).length} staff memiliki perubahan yang belum disimpan
          </p>
        ) : (
          <p className="text-sm text-gray-400">Belum ada perubahan</p>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
          ) : (
            <><Save size={15} />Simpan Jadwal</>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const FoManagementPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("staff"); // "staff" | "schedule"

  // ── UI state ─────────────────────────────────────────────────────────────
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editItem,        setEditItem]        = useState(null);
  const [viewItem,        setViewItem]        = useState(null);
  const [deactivateTarget,setDeactivateTarget]= useState(null);
  const [form,            setForm]            = useState(emptyForm());
  const [errors,          setErrors]          = useState({});
  const [filterStatus,    setFilterStatus]    = useState("");
  const [search,          setSearch]          = useState("");
  const [loadingShift,    setLoadingShift]    = useState({});
  const [loadingStatus,   setLoadingStatus]   = useState({});
  const [page,            setPage]            = useState(1);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["fo-users", filterStatus, page],
    queryFn:  () => userService.getAll({
      role: "fo",
      ...(filterStatus && { status: filterStatus }),
      page,
    }),
    retry: false,
  });

  const users    = data?.data ?? [];
  const meta     = data?.meta ?? {};
  const summary  = meta?.summary ?? {};

  // Filter search lokal
  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  // ── Fetch detail untuk view modal ─────────────────────────────────────────
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["fo-user-detail", viewItem?.id],
    queryFn:  () => userService.getById(viewItem.id),
    enabled:  !!viewItem,
    retry: false,
  });
  const detail = detailData?.data;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      toast.success("Staff FO berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: ["fo-users"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menambahkan staff."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      toast.success("Data staff berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ["fo-users"] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal memperbarui data staff."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => userService.deactivate(id),
    onSuccess: () => {
      toast.success("Staff berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["fo-users"] });
      setDeactivateTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menonaktifkan staff."),
  });

  // ── Inline shift update ───────────────────────────────────────────────────
  const handleShiftChange = async (userId, newShift) => {
    setLoadingShift((p) => ({ ...p, [userId]: true }));
    try {
      await userService.updateShift(userId, newShift);
      toast.success("Shift berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["fo-users"] });
    } catch {
      toast.error("Gagal memperbarui shift.");
    } finally {
      setLoadingShift((p) => ({ ...p, [userId]: false }));
    }
  };

  // ── Inline status update ──────────────────────────────────────────────────
  const handleStatusChange = async (userId, newStatus) => {
    if (newStatus === "inactive") {
      // Untuk nonaktifkan, pakai modal konfirmasi
      const user = users.find((u) => u.id === userId);
      setDeactivateTarget(user);
      return;
    }
    setLoadingStatus((p) => ({ ...p, [userId]: true }));
    try {
      await userService.update(userId, { status: newStatus });
      toast.success("Status berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["fo-users"] });
    } catch {
      toast.error("Gagal memperbarui status.");
    } finally {
      setLoadingStatus((p) => ({ ...p, [userId]: false }));
    }
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditItem(user);
    setForm({
      name:                  user.name ?? "",
      email:                 user.email ?? "",
      password:              "",
      password_confirmation: "",
      shift:                 user.shift ?? "pagi",
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(null);
    setForm(emptyForm());
    setErrors({});
  };

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Nama wajib diisi.";
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email tidak valid.";

    if (!editItem) {
      // Tambah: password wajib
      if (!form.password) e.password = "Password wajib diisi.";
      else if (form.password.length < 6) e.password = "Password minimal 6 karakter.";
      if (form.password !== form.password_confirmation)
        e.password_confirmation = "Konfirmasi password tidak cocok.";
    } else {
      // Edit: password opsional, tapi jika diisi harus valid
      if (form.password) {
        if (form.password.length < 6) e.password = "Password minimal 6 karakter.";
        if (form.password !== form.password_confirmation)
          e.password_confirmation = "Konfirmasi password tidak cocok.";
      }
    }

    if (!form.shift) e.shift = "Shift wajib dipilih.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name:  form.name,
      email: form.email,
      shift: form.shift,
      role:  "fo",
    };
    if (form.password) {
      payload.password              = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;


  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Front Office Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data dan jadwal staff Front Office</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          id="btn-tambah-fo"
        >
          <Plus size={16} />
          Tambah Staff FO
        </button>
      </div>

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "FO Staff",  value: summary.total_fo       ?? 0, icon: Users,      color: "bg-indigo-50 text-indigo-700" },
          { label: "Active",    value: summary.total_active   ?? 0, icon: UserCheck,  color: "bg-emerald-50 text-emerald-700" },
          { label: "Inactive",  value: summary.total_inactive ?? 0, icon: UserMinus,  color: "bg-red-50 text-red-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "staff"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          👥 Daftar Staff
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "schedule"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📅 Jadwal Mingguan
        </button>
      </div>

      {/* ── Tab: Jadwal Mingguan ── */}
      {activeTab === "schedule" && <WeeklyScheduleTab />}

      {/* ── Tab: Daftar Staff ── */}
      {activeTab === "staff" && (<>

      {/* ── Filter & Search ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(filterStatus || search) && (
          <button
            onClick={() => { setFilterStatus(""); setSearch(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* ── Tabel ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Front Office List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["No", "Nama", "Shift", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Tidak ada staff FO ditemukan</p>
                    <button onClick={openAdd} className="mt-3 text-xs text-indigo-600 underline">
                      Tambah staff pertama
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr key={user.id} className={`transition-colors ${user.status === "inactive" ? "bg-gray-50/60" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 text-gray-500">
                      {(page - 1) * (meta?.pagination?.per_page ?? 20) + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={`font-medium ${user.status === "inactive" ? "text-gray-400" : "text-gray-800"}`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <InlineDropdown
                        value={user.shift ?? "pagi"}
                        options={SHIFT_OPTIONS}
                        onChange={(val) => handleShiftChange(user.id, val)}
                        isLoading={!!loadingShift[user.id]}
                        disabled={user.status === "inactive"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <InlineDropdown
                        value={user.status}
                        options={STATUS_OPTIONS}
                        onChange={(val) => handleStatusChange(user.id, val)}
                        isLoading={!!loadingStatus[user.id]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {/* View */}
                        <button
                          onClick={() => setViewItem(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={14} />
                        </button>
                        {/* Nonaktifkan */}
                        {user.status === "active" && (
                          <button
                            onClick={() => setDeactivateTarget(user)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Nonaktifkan"
                          >
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta?.pagination?.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Menampilkan {filtered.length} dari {meta.pagination.total} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: meta.pagination.last_page }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.pagination.last_page || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        page === p ? "bg-indigo-600 text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(meta.pagination.last_page, p + 1))}
                disabled={page === meta.pagination.last_page}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Tambah / Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isSaving ? closeModal : undefined} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">
                {editItem ? "Edit Staff FO" : "Tambah Staff FO"}
              </h3>
              <button onClick={closeModal} disabled={isSaving} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Nama lengkap staff"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="email@puriasih.com"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Password {!editItem && <span className="text-red-500">*</span>}
                  {editItem && <span className="text-gray-400 font-normal normal-case">(kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={editItem ? "Biarkan kosong jika tidak diubah" : "Min. 6 karakter"}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Konfirmasi Password {!editItem && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => setField("password_confirmation", e.target.value)}
                  placeholder="Ulangi password"
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password_confirmation ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.password_confirmation && (
                  <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
                )}
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Shift <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.shift}
                  onChange={(e) => setField("shift", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.shift ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errors.shift && <p className="text-xs text-red-500 mt-1">{errors.shift}</p>}
              </div>

              {/* Role (readonly) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Role</label>
                <input
                  type="text"
                  value="Front Office"
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  id="btn-save-fo"
                >
                  {isSaving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
                  ) : (
                    editItem ? "Update" : "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal View Detail ── */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-800">Detail Staff FO</h3>
              <button onClick={() => setViewItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-400">
                <span className="w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin inline-block" />
              </div>
            ) : detail ? (
              <div className="p-5 space-y-4">
                {/* Avatar + nama */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {detail.user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{detail.user?.name}</p>
                    <p className="text-sm text-gray-500">{detail.user?.email}</p>
                    <StatusBadge status={detail.user?.status} />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  {[
                    ["Jabatan",       "Front Office"],
                    ["Shift",         detail.user?.shift_label ?? "-"],
                    ["Bergabung",     detail.user?.created_at ?? "-"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Statistik */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statistik</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Total Shift",       detail.stats?.total_shift ?? 0],
                      ["Total KAS",         detail.stats?.total_kas ?? 0],
                      ["Total Pengeluaran", detail.stats?.total_expenses ?? 0],
                      ["Total Reservasi",   detail.stats?.total_reservations ?? 0],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-800">{val}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">Gagal memuat detail.</div>
            )}

            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setViewItem(null)}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Nonaktifkan ── */}
      <ConfirmModal
        isOpen={!!deactivateTarget}
        title="Nonaktifkan Staff"
        message={`Nonaktifkan ${deactivateTarget?.name}? Staff tidak akan bisa login dan semua sesi aktif akan dihapus.`}
        confirmText="Nonaktifkan"
        confirmVariant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)}
        onCancel={() => setDeactivateTarget(null)}
      />

      </>)}

    </div>
  );
};

export default FoManagementPage;
