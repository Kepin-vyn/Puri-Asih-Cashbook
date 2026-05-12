import api from "../utils/axios";

const attendanceService = {
  /**
   * GET /api/v1/attendance
   * params: { month, year, user_id, status }
   */
  getAll: async (params = {}) => {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  /**
   * POST /api/v1/attendance/checkin
   * data: { digital_signature (base64), shift_type? }
   */
  checkin: async (data) => {
    const response = await api.post("/attendance/checkin", data);
    return response.data;
  },

  /**
   * POST /api/v1/attendance/checkout
   */
  checkout: async () => {
    const response = await api.post("/attendance/checkout");
    return response.data;
  },

  /**
   * PUT /api/v1/attendance/{id}/status
   * Manager only — update status absensi staff
   * data: { status: 'hadir' | 'libur' | 'sakit' | 'izin' | 'alpha' }
   */
  updateStatus: async (id, status) => {
    const response = await api.put(`/attendance/${id}/status`, { status });
    return response.data;
  },

  /**
   * GET /api/v1/attendance/monthly/{staffId}
   * Rekap absensi bulanan satu staff
   * params: { month, year }
   */
  getMonthly: async (staffId, params = {}) => {
    const response = await api.get(`/attendance/monthly/${staffId}`, { params });
    return response.data;
  },
};

export default attendanceService;
