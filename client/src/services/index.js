import api from "./api";
import {
  AUTH,
  VENDORS,
  PACKAGES,
  BOOKINGS,
  VENDOR_REQUESTS,
  ADMIN,
  GALLERY,
} from "../constants/apiRoutes";

const d = (r) => r.data?.data ?? r.data;

export const authService = {
  login: (c) => api.post(AUTH.LOGIN, c).then(d),
  register: (d2) => api.post(AUTH.REGISTER, d2).then(d),
  verifyOtp: (d2) => api.post(AUTH.VERIFY_OTP, d2).then(d),
  resendOtp: (d2) => api.post(AUTH.RESEND_OTP, d2).then(d),
  me: () => api.get(AUTH.ME).then(d),
  logout: () => api.post(AUTH.LOGOUT).then(d),
  forgotPassword: (e) => api.post(AUTH.FORGOT_PASSWORD, { email: e }).then(d),
  resetPassword: (d2) => api.post(AUTH.RESET_PASSWORD, d2).then(d),
  updateProfile: (d2) => api.put(AUTH.UPDATE_PROFILE, d2).then(d),
  changePassword: (d2) => api.put(AUTH.CHANGE_PASSWORD, d2).then(d),
};

export const vendorService = {
  getAll: (p) => api.get(VENDORS.LIST, { params: p }).then(d),
  getBySlug: (s) => api.get(VENDORS.BY_SLUG(s)).then(d),
  getById: (id) => api.get(VENDORS.DETAIL(id)).then(d),
  getMy: () => api.get(VENDORS.MY).then(d),
  update: (id, data) => api.put(VENDORS.UPDATE(id), data).then(d),
};

export const packageService = {
  getAll: () => api.get(PACKAGES.LIST).then(d),
  getByTier: (t) => api.get(PACKAGES.BY_TIER(t)).then(d),
};

export const bookingService = {
  getMy: () => api.get(BOOKINGS.MY).then(d),
  getById: (id) => api.get(BOOKINGS.DETAIL(id)).then(d),
  create: (data) => api.post(BOOKINGS.CREATE, data).then(d),
  payDp: (id) => api.post(BOOKINGS.PAY_DP(id)).then(d),
  payFull: (id) => api.post(BOOKINGS.PAY_FULL(id)).then(d),
  rate: (id, data) => api.post(BOOKINGS.RATE(id), data).then(d),
};

export const vendorRequestService = {
  getInbox: () => api.get(BOOKINGS.VENDOR_INBOX).then(d),
  confirm: (id, data) => api.post(VENDOR_REQUESTS.CONFIRM(id), data).then(d),
  reject: (id, data) => api.post(VENDOR_REQUESTS.REJECT(id), data).then(d),
};

export const adminService = {
  getStats: () => api.get(ADMIN.STATS).then(d),
  getUsers: (p) => api.get(ADMIN.USERS, { params: p }).then(d),
  deleteUser: (id) => api.delete(ADMIN.USER_DELETE(id)).then(d),

  getVendors: (p) => api.get(ADMIN.VENDORS, { params: p }).then(d),
  createVendor: (data) => api.post(ADMIN.VENDOR_CREATE, data).then(d),
  updateVendor: (id, data) => api.put(ADMIN.VENDOR_UPDATE(id), data).then(d),
  approveVendor: (id) => api.patch(ADMIN.VENDOR_APPROVE(id)).then(d),
  rejectVendor: (id) => api.patch(ADMIN.VENDOR_REJECT(id)).then(d),
  deleteVendor: (id) => api.delete(ADMIN.VENDOR_DELETE(id)).then(d),

  getBookings: (p) => api.get(ADMIN.BOOKINGS, { params: p }).then(d),
  assignVendor: (id, data) => api.patch(ADMIN.ASSIGN_VENDOR(id), data).then(d),
  reassignVendor: (id, data) =>
    api.patch(ADMIN.REASSIGN_VENDOR(id), data).then(d),
  setTechMeeting: (id, data) => api.post(ADMIN.TECH_MEETING(id), data).then(d),
  confirmTech: (id) => api.patch(ADMIN.CONFIRM_TECH(id)).then(d),
  updatePreparation: (id, pct) =>
    api.patch(ADMIN.PREPARATION(id), { preparation_progress: pct }).then(d),
  executeEvent: (id) => api.patch(ADMIN.EXECUTE_EVENT(id)).then(d),
};

export const galleryService = {
  getAll: () => api.get(GALLERY.LIST).then(d),
  upload: (f) => {
    const form = new FormData();
    form.append("image", f);
    return api
      .post(GALLERY.UPLOAD, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(d);
  },
  delete: (id) => api.delete(GALLERY.DELETE(id)).then(d),
};
