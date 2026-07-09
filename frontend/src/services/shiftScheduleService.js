import api from "../utils/axios";

const shiftScheduleService = {
  /**
   * GET /api/v1/shift-schedules/week?date={date}
   * Jadwal semua FO untuk minggu dari tanggal yang diberikan.
   * @param {string} date - format YYYY-MM-DD
   */
  getWeek: async (date) => {
    const response = await api.get("/shift-schedules/week", {
      params: { date },
    });
    return response.data;
  },

  /**
   * GET /api/v1/shift-schedules/today
   * Shift hari ini untuk FO yang login.
   */
  getTodayShift: async () => {
    const response = await api.get("/shift-schedules/today");
    return response.data;
  },

  /**
   * POST /api/v1/shift-schedules
   * Buat atau update jadwal (upsert).
   * @param {{ user_id, week_start_date, monday, tuesday, ... }} data
   */
  store: async (data) => {
    const response = await api.post("/shift-schedules", data);
    return response.data;
  },

  /**
   * PUT /api/v1/shift-schedules/{id}
   * Update jadwal yang sudah ada.
   */
  update: async (id, data) => {
    const response = await api.put(`/shift-schedules/${id}`, data);
    return response.data;
  },
};

export default shiftScheduleService;
