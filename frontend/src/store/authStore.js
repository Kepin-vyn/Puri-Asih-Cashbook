const TOKEN_KEY = "token";
const USER_KEY = "user";

const authStore = {
  // Simpan token dan data user saat login berhasil
  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Hapus semua data saat logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Ambil token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Ambil data user (object)
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Ambil role user
  getRole: () => {
    const user = authStore.getUser();
    return user?.role ?? null;
  },

  // Cek apakah sudah login
  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Cek apakah user adalah Manager
  isManager: () => {
    return authStore.getRole() === "manager";
  },

  // Cek apakah user adalah Front Office
  isFo: () => {
    return authStore.getRole() === "fo";
  },
};

export default authStore;
