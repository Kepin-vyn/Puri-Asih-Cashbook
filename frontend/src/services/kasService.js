import api from "../utils/axios";

const kasService = {
  /**
   * GET /api/v1/kas
   * params: { date, shift_id, user_id, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/kas", { params });
    return response.data;
  },

  /**
   * GET /api/v1/kas/{id}
   */
  getById: async (id) => {
    const response = await api.get(`/kas/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/kas
   */
  create: async (data) => {
    const response = await api.post("/kas", data);
    return response.data;
  },

  /**
   * PUT /api/v1/kas/{id}
   */
  update: async (id, data) => {
    const response = await api.put(`/kas/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/kas/{id}
   */
  remove: async (id) => {
    const response = await api.delete(`/kas/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/kas/{id}/upload
   * Upload bukti struk (FormData)
   */
  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append("receipt", file); // backend expects field name 'receipt'
    const response = await api.post(`/kas/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * GET /api/v1/kas/export/pdf
   * Download PDF laporan KAS (response: blob)
   */
  exportPdf: async (params = {}) => {
    // Backend accepts: date_from, date_to, shift_id, staff_id
    // If single 'date' is passed, use it as both from and to
    const exportParams = { ...params };
    if (params.date && !params.date_from) {
      exportParams.date_from = params.date;
      exportParams.date_to   = params.date;
      delete exportParams.date;
    }
    const response = await api.get("/kas/export/pdf", {
      params: exportParams,
      responseType: "blob",
    });
    return response;
  },
};

export default kasService;
