import api from "../utils/axios";

const dashboardService = {
  /**
   * Ambil summary untuk Dashboard FO (berdasarkan shift aktif)
   */
  getFoSummary: async () => {
    const response = await api.get("/shifts/active/summary");
    return response.data;
  },

  /**
   * Ambil summary untuk Dashboard Manager (hari ini)
   */
  getManagerSummary: async () => {
    const today = new Date().toISOString().split("T")[0];
    const [kasRes, expenseRes, reservationRes, pendingRes] = await Promise.allSettled([
      api.get(`/kas?date=${today}`),
      api.get(`/expenses?date=${today}`),
      api.get(`/reservations?date_from=${today}&date_to=${today}`),
      api.get("/expenses/pending/count"),
    ]);

    const kasData        = kasRes.status === "fulfilled" ? kasRes.value.data : null;
    const expenseData    = expenseRes.status === "fulfilled" ? expenseRes.value.data : null;
    const reservationData = reservationRes.status === "fulfilled" ? reservationRes.value.data : null;
    const pendingData    = pendingRes.status === "fulfilled" ? pendingRes.value.data : null;

    return {
      total_revenue:      kasData?.meta?.total_amount ?? 0,
      total_expenses:     expenseData?.meta?.totals?.total_valid ?? 0,
      total_reservations: reservationData?.meta?.summary?.total_reservations ?? 0,
      pending_count:      pendingData?.data?.count ?? 0,
    };
  },

  /**
   * Ambil notifikasi terbaru (5 terbaru)
   */
  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },

  /**
   * Tandai notifikasi sebagai sudah dibaca
   */
  markNotificationRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Ambil jumlah notifikasi yang belum dibaca
   */
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread/count");
    return response.data;
  },

  /**
   * Ambil data pengeluaran pending untuk manager
   */
  getPendingExpenses: async () => {
    const response = await api.get("/expenses?status=pending");
    return response.data;
  },

  /**
   * Approve pengeluaran (Manager only)
   */
  approveExpense: async (id) => {
    const response = await api.post(`/expenses/${id}/approve`);
    return response.data;
  },
};

export default dashboardService;
