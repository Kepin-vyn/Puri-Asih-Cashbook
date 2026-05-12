import api from "../utils/axios";

const userService = {
  /**
   * GET /api/v1/users?role=fo
   * Ambil semua staff FO (untuk dropdown handover)
   * Hanya bisa diakses Manager — FO menggunakan endpoint ini
   * hanya untuk keperluan dropdown pilih penerima handover.
   */
  getAllFo: async () => {
    const response = await api.get("/users", { params: { role: "fo" } });
    return response.data;
  },

  /**
   * GET /api/v1/users
   * Ambil semua user (Manager only)
   * params: { role, status, page }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  /**
   * GET /api/v1/users/{id}
   */
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * POST /api/v1/users
   */
  create: async (data) => {
    const response = await api.post("/users", data);
    return response.data;
  },

  /**
   * PUT /api/v1/users/{id}
   */
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/users/{id}
   */
  remove: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * PUT /api/v1/users/{id}/role
   */
  updateRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * PUT /api/v1/users/{id}/shift
   */
  updateShift: async (id, shift) => {
    const response = await api.put(`/users/${id}/shift`, { shift });
    return response.data;
  },
};

export default userService;
