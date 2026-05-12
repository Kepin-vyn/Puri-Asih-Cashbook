import api from "../utils/axios";

const shiftService = {
  /**
   * GET /api/v1/shifts/active
   * Ambil shift yang sedang aktif milik FO yang login
   */
  getActive: async () => {
    const response = await api.get("/shifts/active");
    return response.data;
  },

  /**
   * GET /api/v1/shifts/{id}/summary
   * Ringkasan shift: total kas, reservasi, pengeluaran, saldo
   */
  getSummary: async (id) => {
    const response = await api.get(`/shifts/${id}/summary`);
    return response.data;
  },

  /**
   * GET /api/v1/shifts/{id}/report
   * Detail laporan shift (list transaksi per kategori)
   */
  getReport: async (id) => {
    const response = await api.get(`/shifts/${id}/report`);
    return response.data;
  },

  /**
   * GET /api/v1/shifts/{id}/report/pdf
   * Download Shift Report PDF (response: blob)
   */
  downloadReportPdf: async (id) => {
    const response = await api.get(`/shifts/${id}/report/pdf`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * POST /api/v1/shifts/start
   * Mulai shift baru
   */
  startShift: async () => {
    const response = await api.post("/shifts/start");
    return response.data;
  },

  /**
   * POST /api/v1/shifts/{id}/handover
   * Serahkan shift ke FO berikutnya
   * @param {number} id - ID shift aktif
   * @param {{ handover_to: number, handover_note?: string }} data
   */
  handover: async (id, data) => {
    const response = await api.post(`/shifts/${id}/handover`, data);
    return response.data;
  },

  /**
   * GET /api/v1/shifts/daily/{date}
   * Laporan harian semua shift pada tanggal tertentu
   * @param {string} date - format YYYY-MM-DD
   */
  getDaily: async (date) => {
    const response = await api.get(`/shifts/daily/${date}`);
    return response.data;
  },

  /**
   * GET /api/v1/shifts/daily/{date}/pdf
   * Download Daily Report PDF (response: blob)
   * @param {string} date - format YYYY-MM-DD
   */
  downloadDailyPdf: async (date) => {
    const response = await api.get(`/shifts/daily/${date}/pdf`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * GET /api/v1/shifts
   * List semua shift (untuk riwayat laporan FO)
   * params: { user_id, month, year, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/shifts", { params });
    return response.data;
  },
};

export default shiftService;
