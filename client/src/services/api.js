import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "../services";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      pendingEmail: null, // email yg menunggu OTP verify

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login(credentials);
          set({
            token: data.token,
            user: data.user,
            isLoading: false,
            pendingEmail: null,
          });
          sessionStorage.setItem("amaranta_token", data.token);
          return data;
        } catch (err) {
          set({
            error: err.userMessage || err.message || "Login gagal.",
            isLoading: false,
          });
          throw err;
        }
      },

      // Register: TIDAK set token — simpan pendingEmail untuk step OTP
      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register(formData);
          // Hanya catat email yang perlu diverifikasi, belum login
          set({ isLoading: false, pendingEmail: formData.email });
          return data;
        } catch (err) {
          set({
            error: err.userMessage || err.message || "Pendaftaran gagal.",
            isLoading: false,
          });
          throw err;
        }
      },

      // verifyOtp: baru set token dan user (login resmi)
      verifyOtp: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.verifyOtp(payload);
          set({
            token: data.token,
            user: data.user,
            isLoading: false,
            pendingEmail: null,
          });
          sessionStorage.setItem("amaranta_token", data.token);
          return data;
        } catch (err) {
          set({
            error: err.userMessage || err.message || "OTP tidak valid.",
            isLoading: false,
          });
          throw err;
        }
      },

      updateProfile: async (formData) => {
        try {
          const data = await authService.updateProfile(formData);
          set((s) => ({ user: { ...s.user, ...data } }));
          return data;
        } catch (err) {
          throw err;
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),

      logout: async () => {
        try {
          await authService.logout();
        } catch {}
        sessionStorage.removeItem("amaranta_token");
        localStorage.removeItem("amaranta_token"); // clear legacy
        set({ user: null, token: null, error: null, pendingEmail: null });
      },
    }),
    {
      name: "amaranta-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);

export default useAuthStore;
