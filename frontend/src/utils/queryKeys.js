/**
 * queryKeys.js
 * Centralized Query Keys — single source of truth untuk semua React Query keys.
 * Menghindari typo dan inkonsistensi antar file.
 */

export const QUERY_KEYS = {
  // ── Auth & User ────────────────────────────────────────────────────────────
  activeUser:       ["active-user"],

  // ── Shift ──────────────────────────────────────────────────────────────────
  activeShift:      ["active-shift"],
  shiftSummary:     (shiftId) => ["shift-summary", shiftId],
  shiftList:        (params) => ["shifts", params],
  foDashboard:      ["fo-shift-summary"],   // key yang dipakai DashboardPage
  managerDashboard: ["manager-dashboard"],

  // ── KAS ────────────────────────────────────────────────────────────────────
  kasTransactions:  (params) => ["kas-list", params],
  kasToday:         (date) => ["kas-today", date],

  // ── Pengeluaran ────────────────────────────────────────────────────────────
  expenses:         (params) => ["expenses", params],
  expenseToday:     (date) => ["expense-today", date],
  pendingCount:     ["pending-approval-count"],

  // ── Reservasi ──────────────────────────────────────────────────────────────
  reservations:     (params) => ["reservations", params],
  roomAvailability: (checkIn, checkOut) => ["room-availability", checkIn, checkOut],

  // ── Deposit ────────────────────────────────────────────────────────────────
  deposits:         (params) => ["deposits", params],
  expiringDeposits: ["deposits-expiring"],

  // ── Shift Report ───────────────────────────────────────────────────────────
  shiftReport:      (id) => ["shift-report", id],
  dailyReport:      (date) => ["daily-report", date],

  // ── Monthly Report ─────────────────────────────────────────────────────────
  monthlyReport:    (params) => ["monthly-report", params],
  monthlySummary:   (params) => ["monthly-summary", params],

  // ── Attendance ─────────────────────────────────────────────────────────────
  attendance:       (params) => ["attendance", params],
  todayAttendance:  ["today-attendance"],

  // ── Payroll ────────────────────────────────────────────────────────────────
  payrollSettings:  ["payroll-settings"],
  payroll:          (month, year) => ["payroll", month, year],
  payrollDetail:    (month, staffId) => ["payroll-detail", month, staffId],

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications:    ["notifications"],
  unreadCount:      ["unread-count"],

  // ── Users ──────────────────────────────────────────────────────────────────
  users:            (params) => ["users", params],

  // ── Shift Schedule ─────────────────────────────────────────────────────────
  shiftSchedule:    (weekStart) => ["shift-schedule", weekStart],
  todayShift:       ["today-shift"],
};
