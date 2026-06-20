import api from "../utils/axios";

const BASE = '/activity-logs';

export const activityLogService = {
  /**
   * Fetch activity logs with optional filters
   */
  getLogs: async (params = {}) => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  /**
   * Get available modules for filter
   */
  getModules: async () => {
    const response = await api.get(`${BASE}/modules`);
    return response.data;
  },

  /**
   * Get shifts for filter
   */
  getShifts: async () => {
    const response = await api.get(`${BASE}/shifts`);
    return response.data;
  },
};
