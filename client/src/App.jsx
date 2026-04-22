// ============================================================
// src/App.jsx — Router AMARANTA (versi final fix)
// FIX:
//   1. Route /pelanggan/profil ditambahkan
//   2. Vendor route: public /vendor & /vendor/:slug TERPISAH dari /vendor-panel
//   3. Semua route protected sudah benar
// ============================================================
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import ToastContainer from "./components/ToastContainer";

// ── Public ──────────────────────────────────────────────────
import Landing from "./pages/public/Landing";
import Packages from "./pages/public/Packages";
// VendorList & VendorDetail dihapus — AMARANTA adalah 1 vendor
import Gallery from "./pages/public/Gallery";
import About from "./pages/public/About";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Verifikasi from "./pages/public/Verifikasi";
import BookingForm from "./pages/public/BookingForm";

// ── Admin ────────────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminVendors from "./pages/admin/Vendors";
import AdminUsers from "./pages/admin/Users";
import AdminBookings from "./pages/admin/Bookings";

// ── Vendor Panel ─────────────────────────────────────────────
import VendorLayout from "./layouts/VendorLayout";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorBookings from "./pages/vendor/Bookings";

// ── Customer ─────────────────────────────────────────────────
import CustomerLayout from "./layouts/CustomerLayout";
import CustomerMyBookings from "./pages/customer/MyBookings";
import CustomerProfile from "./pages/customer/Profile";
import CustomerInvoice from "./pages/customer/Invoice";

// ── Route Guards ─────────────────────────────────────────────

// Harus login
function PrivateRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return token && user ? <Outlet /> : <Navigate to="/masuk" replace />;
}

// Cek role spesifik
function RoleRoute({ allowedRoles }) {
  const user = useAuthStore((s) => s.user);
  return user && allowedRoles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}

// Hanya untuk tamu — redirect jika sudah login
function GuestRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!(token && user)) return <Outlet />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "vendor")
    return <Navigate to="/vendor-panel/dashboard" replace />;
  return <Navigate to="/pelanggan/pemesanan" replace />;
}

// ─────────────────────────────────────────────────────────────

function App() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  // Validasi token ke backend saat pertama load
  // Hanya logout jika 401 (token benar-benar tidak valid)
  // Kalau backend mati / network error → jangan logout, biarkan user tetap login
  useEffect(() => {
    if (!token) return;
    const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const storedToken =
      sessionStorage.getItem("amaranta_token") ||
      localStorage.getItem("amaranta_token") ||
      token;
    fetch(API + "/auth/me", {
      headers: {
        Authorization: "Bearer " + storedToken,
        Accept: "application/json",
      },
    })
      .then((r) => {
        // Hanya logout jika token benar-benar invalid (401)
        // Status lain (500, network error) = jangan logout
        if (r.status === 401) {
          logout();
        }
      })
      .catch(() => {
        // Backend tidak bisa diakses → jangan logout
        // User tetap login dengan token yang ada
      });
  }, [token]);

  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          {/* ── PUBLIK (semua bisa akses) ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/paket" element={<Packages />} />
          {/* /vendor & /vendor/:slug dihapus — AMARANTA 1 vendor */}
          <Route path="/galeri" element={<Gallery />} />
          <Route path="/tentang" element={<About />} />
          {/* /pesan/:tierId — form pemesanan langsung, butuh login */}

          {/* ── GUEST ONLY (redirect jika sudah login) ── */}
          <Route element={<GuestRoute />}>
            <Route path="/masuk" element={<Login />} />
            <Route path="/daftar" element={<Register />} />
            <Route path="/verifikasi" element={<Verifikasi />} />
          </Route>

          {/* ── PROTECTED (harus login) ── */}
          <Route element={<PrivateRoute />}>
            <Route path="/pesan/:tierId" element={<BookingForm />} />

            {/* Admin */}
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
              </Route>
            </Route>

            {/* Vendor Panel — TERPISAH dari /vendor (public) */}
            <Route element={<RoleRoute allowedRoles={["vendor"]} />}>
              <Route element={<VendorLayout />}>
                <Route
                  path="/vendor-panel"
                  element={<Navigate to="/vendor-panel/dashboard" replace />}
                />
                <Route
                  path="/vendor-panel/dashboard"
                  element={<VendorDashboard />}
                />
                <Route
                  path="/vendor-panel/bookings"
                  element={<VendorBookings />}
                />
              </Route>
            </Route>

            {/* Invoice — full screen, tanpa CustomerLayout */}
            <Route element={<RoleRoute allowedRoles={["customer"]} />}>
              <Route
                path="/pelanggan/invoice/:id"
                element={<CustomerInvoice />}
              />
            </Route>

            {/* Customer */}
            <Route element={<RoleRoute allowedRoles={["customer"]} />}>
              <Route element={<CustomerLayout />}>
                <Route
                  path="/pelanggan/pemesanan"
                  element={<CustomerMyBookings />}
                />
                <Route path="/pelanggan/profil" element={<CustomerProfile />} />
              </Route>
            </Route>
          </Route>

          {/* ── 404 ── */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cream)] gap-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)]">
                  404
                </p>
                <h1 className="font-[var(--font-display)] text-5xl text-[var(--color-dark)]">
                  Halaman tidak ditemukan
                </h1>
                <a
                  href="/"
                  className="text-sm text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
                >
                  ← Kembali ke Beranda
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
