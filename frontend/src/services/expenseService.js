import api from "../utils/axios";

const expenseService = {
  /**
   * GET /api/v1/expenses
   * params: { status, date, shift_id, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/expenses", { params });
    return response.data;
  },

  /**
   * GET /api/v1/expenses/{id}
   */
  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/expenses
   */
  create: async (data) => {
    const response = await api.post("/expenses", data);
    return response.data;
  },

  /**
   * PUT /api/v1/expenses/{id}
   */
  update: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/expenses/{id}
   */
  remove: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/expenses/{id}/upload
   * Upload bukti struk (FormData)
   */
  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append("receipt", file);
    const response = await api.post(`/expenses/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * GET /api/v1/expenses/pending/count
   * Jumlah pengeluaran pending (untuk badge Manager)
   */
  getPendingCount: async () => {
    const response = await api.get("/expenses/pending/count");
    return response.data;
  },

  /**
   * POST /api/v1/expenses/{id}/approve
   * Manager approve pengeluaran
   */
  approve: async (id) => {
    const response = await api.post(`/expenses/${id}/approve`);
    return response.data;
  },

  /**
   * POST /api/v1/expenses/{id}/reject
   * Manager reject pengeluaran dengan alasan
   */
  reject: async (id, rejection_reason) => {
    const response = await api.post(`/expenses/${id}/reject`, { rejection_reason });
    return response.data;
  },

  /**
   * GET /api/v1/expenses/export/pdf
   * Download PDF laporan pengeluaran (response: blob)
   */
  exportPdf: async (params = {}) => {
    const response = await api.get("/expenses/export/pdf", {
      params,
      responseType: "blob",
    });
    return response;
  },
};

export default expenseService;
