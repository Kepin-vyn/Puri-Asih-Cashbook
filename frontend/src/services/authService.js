import axios from "axios";
import authStore from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL;

// Instance axios dengan base URL dari .env
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor: sertakan token di setiap request jika tersedia
api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authService = {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise} response data { token, user }
   */
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * Logout user (invalidate token di server)
   * @returns {Promise}
   */
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  /**
   * Ambil data user yang sedang login
   * @returns {Promise} response data { user }
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export default authService;
