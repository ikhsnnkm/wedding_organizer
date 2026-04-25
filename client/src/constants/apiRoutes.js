// Pakai VITE_API_URL dari .env
// Vite proxy di vite.config.js akan forward /api/* ke Laravel
export const BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const AUTH = {
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  VERIFY_OTP: `${BASE_URL}/auth/verify-otp`,
  RESEND_OTP: `${BASE_URL}/auth/resend-otp`,
  ME: `${BASE_URL}/auth/me`,
  LOGOUT: `${BASE_URL}/auth/logout`,
  FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  UPDATE_PROFILE: `${BASE_URL}/auth/profile`,
  CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
};

export const VENDORS = {
  LIST: `${BASE_URL}/vendors`,
  BY_SLUG: (slug) => `${BASE_URL}/vendors/slug/${slug}`,
  DETAIL: (id) => `${BASE_URL}/vendors/${id}`,
  MY: `${BASE_URL}/vendors/my`,
  UPDATE: (id) => `${BASE_URL}/vendors/${id}`,
};

export const PACKAGES = {
  LIST: `${BASE_URL}/packages`,
  BY_TIER: (tier) => `${BASE_URL}/packages/${tier}`,
};

export const BOOKINGS = {
  MY: `${BASE_URL}/bookings/my`,
  VENDOR_INBOX: `${BASE_URL}/bookings/vendor`,
  DETAIL: (id) => `${BASE_URL}/bookings/${id}`,
  CREATE: `${BASE_URL}/bookings`,
  PAY_DP: (id) => `${BASE_URL}/bookings/${id}/pay-dp`,
  PAY_FULL: (id) => `${BASE_URL}/bookings/${id}/pay-full`,
  RATE: (id) => `${BASE_URL}/bookings/${id}/rate`,
};

export const VENDOR_REQUESTS = {
  CONFIRM: (id) => `${BASE_URL}/vendor-requests/${id}/confirm`,
  REJECT: (id) => `${BASE_URL}/vendor-requests/${id}/reject`,
};

export const ADMIN = {
  STATS: `${BASE_URL}/admin/stats`,
  USERS: `${BASE_URL}/admin/users`,
  USER_DELETE: (id) => `${BASE_URL}/admin/users/${id}`,
  VENDORS: `${BASE_URL}/admin/vendors`,
  VENDOR_CREATE: `${BASE_URL}/admin/vendors`,
  VENDOR_UPDATE: (id) => `${BASE_URL}/admin/vendors/${id}`,
  VENDOR_APPROVE: (id) => `${BASE_URL}/admin/vendors/${id}/approve`,
  VENDOR_REJECT: (id) => `${BASE_URL}/admin/vendors/${id}/reject`,
  VENDOR_DELETE: (id) => `${BASE_URL}/admin/vendors/${id}`,
  BOOKINGS: `${BASE_URL}/admin/bookings`,
  ASSIGN_VENDOR: (id) => `${BASE_URL}/admin/bookings/${id}/assign-vendor`,
  REASSIGN_VENDOR: (id) => `${BASE_URL}/admin/bookings/${id}/reassign-vendor`,
  TECH_MEETING: (id) => `${BASE_URL}/admin/bookings/${id}/tech-meeting`,
  CONFIRM_TECH: (id) => `${BASE_URL}/admin/bookings/${id}/confirm-tech-meeting`,
  PREPARATION: (id) => `${BASE_URL}/admin/bookings/${id}/preparation`,
  EXECUTE_EVENT: (id) => `${BASE_URL}/admin/bookings/${id}/execute-event`,
};

export const GALLERY = {
  LIST: `${BASE_URL}/gallery`,
  UPLOAD: `${BASE_URL}/gallery`,
  DELETE: (id) => `${BASE_URL}/gallery/${id}`,
};
