import api from "../utils/axios";

const BASE = "/room-rates";

const roomRateService = {
  /**
   * GET /api/v1/room-rates
   */
  getAll: async () => {
    const response = await api.get(BASE);
    return response.data;
  },

  /**
   * PUT /api/v1/room-rates/{roomNumber}
   */
  update: async (roomNumber, pricePerNight) => {
    const response = await api.put(`${BASE}/${roomNumber}`, {
      price_per_night: pricePerNight,
    });
    return response.data;
  },

  /**
   * PUT /api/v1/room-rates/bulk
   */
  bulkUpdate: async (rates) => {
    const response = await api.put(`${BASE}/bulk`, { rates });
    return response.data;
  },

  /**
   * GET /api/v1/room-rates/calculate
   */
  calculate: async (roomNumber, checkInDate, checkOutDate) => {
    const response = await api.get(`${BASE}/calculate`, {
      params: {
        room_number: roomNumber,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      },
    });
    return response.data;
  },
};

export default roomRateService;
