import api from "../utils/axios";

const payrollService = {
  /**
   * GET /api/v1/payroll/{month}
   * Rekap gaji semua staff bulan tertentu
   * @param {string} month - format "YYYY-MM"
   */
  getMonthly: async (month) => {
    const response = await api.get(`/payroll/${month}`);
    return response.data;
  },

  /**
   * GET /api/v1/payroll/{month}/{staffId}
   * Detail gaji satu staff
   */
  getDetail: async (month, staffId) => {
    const response = await api.get(`/payroll/${month}/${staffId}`);
    return response.data;
  },

  /**
   * POST /api/v1/payroll/calculate/{month}
   * Hitung/recalculate gaji semua staff bulan tertentu
   */
  calculate: async (month) => {
    const response = await api.post(`/payroll/calculate/${month}`);
    return response.data;
  },

  /**
   * GET /api/v1/payroll/{month}/{staffId}/slip
   * Download slip gaji PDF (response: blob)
   */
  downloadSlip: async (month, staffId) => {
    const response = await api.get(`/payroll/${month}/${staffId}/slip`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * GET /api/v1/payroll/{month}/export/pdf
   * Download rekap gaji semua staff PDF (response: blob)
   */
  exportPdf: async (month) => {
    const response = await api.get(`/payroll/${month}/export/pdf`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * PUT /api/v1/payroll/settings/daily-rate
   * Set gaji harian (Manager only)
   * @param {number} rate
   */
  setDailyRate: async (rate) => {
    const response = await api.put("/payroll/settings/daily-rate", {
      daily_rate: rate,
    });
    return response.data;
  },
};

export default payrollService;
