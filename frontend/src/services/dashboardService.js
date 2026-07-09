import api from "../utils/axios";

const dashboardService = {
  /**
   * Ambil agregasi data Dashboard FO (1 request)
   */
  getFoDashboard: async () => {
    const response = await api.get("/dashboard/fo");
    return response.data;
  },

  /**
   * Ambil agregasi data Dashboard Manager (1 request)
   */
  getManagerDashboard: async () => {
    const response = await api.get("/dashboard/manager");
    return response.data;
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
