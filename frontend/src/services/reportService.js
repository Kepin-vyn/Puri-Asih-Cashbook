import api from "../utils/axios";

const reportService = {
  /**
   * GET /api/v1/reports/monthly/summary
   * Ringkasan keuangan bulanan: total kas, reservasi, pengeluaran, saldo
   * params: { month, year, user_id }
   */
  getMonthlySummary: async (params = {}) => {
    const response = await api.get("/reports/monthly/summary", { params });
    return response.data;
  },

  /**
   * GET /api/v1/reports/monthly
   * Data laporan bulanan (list transaksi per kategori)
   * params: { month, year, user_id, page }
   */
  getMonthlyData: async (params = {}) => {
    const response = await api.get("/reports/monthly", { params });
    return response.data;
  },

  /**
   * GET /api/v1/reports/monthly/detail
   * Drill-down detail transaksi per tanggal
   * params: { date, month, year, user_id }
   */
  getMonthlyDetail: async (params = {}) => {
    const response = await api.get("/reports/monthly/detail", { params });
    return response.data;
  },

  /**
   * GET /api/v1/reports/monthly/export/pdf
   * Download Monthly Report PDF (response: blob)
   * params: { month, year, user_id }
   */
  exportMonthlyPdf: async (params = {}) => {
    const response = await api.get("/reports/monthly/export/pdf", {
      params,
      responseType: "blob",
    });
    return response;
  },
};

export default reportService;
