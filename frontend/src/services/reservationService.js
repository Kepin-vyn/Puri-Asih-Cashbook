import api from "../utils/axios";

const reservationService = {
  /**
   * GET /api/v1/reservations
   * params: { status, source, date, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/reservations", { params });
    return response.data;
  },

  /**
   * GET /api/v1/reservations/{id}
   */
  getById: async (id) => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/reservations
   */
  create: async (data) => {
    const response = await api.post("/reservations", data);
    return response.data;
  },

  /**
   * PUT /api/v1/reservations/{id}
   */
  update: async (id, data) => {
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
  },

  /**
   * PUT /api/v1/reservations/{id}/status
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/reservations/${id}/status`, { status });
    return response.data;
  },

  /**
   * DELETE /api/v1/reservations/{id}
   */
  remove: async (id) => {
    const response = await api.delete(`/reservations/${id}`);
    return response.data;
  },

  /**
   * GET /api/v1/reservations/{id}/invoice
   * Download invoice PDF (response: blob)
   */
  downloadInvoice: async (id) => {
    const response = await api.get(`/reservations/${id}/invoice`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * GET /api/v1/reservations/availability
   * params: { check_in_date, check_out_date }
   */
  checkAvailability: async (params = {}) => {
    const response = await api.get("/reservations/availability", { params });
    return response.data;
  },

  /**
   * GET /api/v1/reservations/export/pdf
   * Download PDF laporan reservasi (response: blob)
   */
  exportPdf: async (params = {}) => {
    const response = await api.get("/reservations/export/pdf", {
      params,
      responseType: "blob",
    });
    return response;
  },
};

export default reservationService;
