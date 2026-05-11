import api from "../utils/axios";

const depositService = {
  /**
   * GET /api/v1/deposits
   * params: { status, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/deposits", { params });
    return response.data;
  },

  /**
   * GET /api/v1/deposits/{id}
   */
  getById: async (id) => {
    const response = await api.get(`/deposits/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/deposits
   */
  create: async (data) => {
    const response = await api.post("/deposits", data);
    return response.data;
  },

  /**
   * PUT /api/v1/deposits/{id}
   */
  update: async (id, data) => {
    const response = await api.put(`/deposits/${id}`, data);
    return response.data;
  },

  /**
   * POST /api/v1/deposits/{id}/refund
   */
  refund: async (id) => {
    const response = await api.post(`/deposits/${id}/refund`);
    return response.data;
  },

  /**
   * POST /api/v1/deposits/{id}/forfeit
   * @param {string} note - alasan deposit hangus (wajib)
   */
  forfeit: async (id, note) => {
    const response = await api.post(`/deposits/${id}/forfeit`, { note });
    return response.data;
  },

  /**
   * GET /api/v1/deposits/expiring
   * Deposit yang check_out_date H-1 atau hari ini
   */
  getExpiring: async () => {
    const response = await api.get("/deposits/expiring");
    return response.data;
  },

  /**
   * GET /api/v1/deposits/export/pdf
   * Download PDF laporan deposit (response: blob)
   */
  exportPdf: async (params = {}) => {
    const response = await api.get("/deposits/export/pdf", {
      params,
      responseType: "blob",
    });
    return response;
  },
};

export default depositService;
