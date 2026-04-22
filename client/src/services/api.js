// ============================================================
// src/services/api.js — Axios instance untuk Laravel backend
//
// KONFIGURASI UNTUK LARAVEL:
//   - Sanctum: token dikirim di Authorization: Bearer
//   - CSRF: jika pakai session-based, uncomment bagian CSRF
//   - Laravel returns { message, data, errors } pattern
// ============================================================
import axios from "axios";
import { BASE_URL } from "../constants/apiRoutes";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  withCredentials: false, // Ganti true jika pakai Laravel Sanctum cookie
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest", // Laravel deteksi AJAX
  },
});

// ── Request Interceptor ──────────────────────────────────────
// Sisipkan Bearer token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("amaranta_token") ||
      localStorage.getItem("amaranta_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────────────
// Handle error global & Laravel error format
api.interceptors.response.use(
  (response) => {
    // Laravel biasanya return { data: {...}, message: '...' }
    // Kita kembalikan langsung agar komponen bisa pakai response.data
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    // Buat pesan error yang user-friendly dari Laravel response
    if (error.response?.data?.errors) {
      // Laravel validation error: { errors: { field: ['msg'] } }
      const firstErrors = Object.values(error.response.data.errors);
      error.userMessage = firstErrors.flat()[0] || "Data tidak valid";
    } else if (message) {
      error.userMessage = message;
    } else if (status === 404) {
      error.userMessage = "Data tidak ditemukan";
    } else if (status === 403) {
      error.userMessage = "Anda tidak memiliki akses";
    } else if (status === 422) {
      error.userMessage = "Data tidak valid, periksa kembali";
    } else if (status >= 500) {
      error.userMessage = "Terjadi kesalahan server. Coba beberapa saat lagi.";
    } else if (!error.response) {
      error.userMessage =
        "Tidak bisa terhubung ke server. Periksa koneksi Anda.";
    } else {
      error.userMessage = "Terjadi kesalahan. Coba lagi.";
    }

    if (status === 401) {
      sessionStorage.removeItem("amaranta_token");
      localStorage.removeItem("amaranta_token");
      sessionStorage.removeItem("amaranta-auth");
      localStorage.removeItem("amaranta-auth");
      // Hanya redirect jika bukan halaman login/daftar
      if (
        !window.location.pathname.includes("/masuk") &&
        !window.location.pathname.includes("/daftar")
      ) {
        window.location.href = "/masuk";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
