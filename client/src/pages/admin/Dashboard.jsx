// ============================================================
// src/pages/admin/Dashboard.jsx
// Pusat komando admin sebagai Wedding Organizer:
//   - Statistik platform
//   - Booking yang butuh tindakan segera (sorted by urgency)
//   - Workflow booking terbaru (assign vendor, tech meeting, eksekusi)
//   - Vendor pending approval
// ============================================================
import { useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import useAuthStore from "../../store/authStore";
import { formatRupiah } from "../../data/packages";

// ── Data Mock ─────────────────────────────────────────────────
const STATS = [
  {
    title: "Booking Aktif",
    value: "12",
    subtitle: "sedang berjalan",
    trend: "+3",
    trendUp: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    title: "Perlu Tindakan",
    value: "4",
    subtitle: "assign vendor / konfirmasi",
    trend: null,
    trendUp: null,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    title: "DP Bulan Ini",
    value: formatRupiah(52500000),
    subtitle: "7 transaksi",
    trend: "+18%",
    trendUp: true,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Vendor Aktif",
    value: "6",
    subtitle: "2 pending approval",
    trend: null,
    trendUp: null,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

// Booking yang butuh tindakan admin segera (urutan prioritas)
const URGENT_BOOKINGS = [
  {
    id: 1,
    order_id: "AMRT-10012345",
    customer: "Rina & Budi",
    paket: "Gold",
    wedding_date: "2025-09-15",
    location: "Jakarta Selatan",
    konsep: "Garden Romantic",
    total_price: 45000000,
    admin_status: "waiting_vendor",
    label: "⚡ Perlu Assign Vendor",
    urgency: "high",
  },
  {
    id: 2,
    order_id: "AMRT-10012349",
    customer: "Dewi & Arif",
    paket: "Platinum",
    wedding_date: "2025-08-20",
    location: "Surabaya",
    konsep: "Modern Minimalist",
    total_price: 85000000,
    admin_status: "vendor_rejected",
    label: "🔄 Vendor Menolak — Pilih Lain",
    urgency: "high",
  },
  {
    id: 3,
    order_id: "AMRT-10012347",
    customer: "Maya & Reza",
    paket: "Gold",
    wedding_date: "2025-09-01",
    location: "Bandung",
    konsep: "Rustic Outdoor",
    total_price: 45000000,
    admin_status: "vendor_confirmed",
    label: "📅 Jadwalkan Tech Meeting",
    urgency: "medium",
  },
  {
    id: 4,
    order_id: "AMRT-10012350",
    customer: "Clara & Bima",
    paket: "Silver",
    wedding_date: "2025-08-10",
    location: "Yogyakarta",
    konsep: "Javanese Classic",
    total_price: 25000000,
    admin_status: "preparation",
    label: "📊 Update Progress Persiapan",
    urgency: "low",
  },
];

// Semua booking (untuk tabel ringkasan)
const ALL_BOOKINGS = [
  ...URGENT_BOOKINGS,
  {
    id: 5,
    order_id: "AMRT-10012346",
    customer: "Sofia & Doni",
    paket: "Platinum",
    wedding_date: "2025-10-20",
    location: "Jakarta",
    konsep: "Royal",
    total_price: 85000000,
    admin_status: "waiting_payment",
    label: "Menunggu DP",
    urgency: "none",
  },
  {
    id: 6,
    order_id: "AMRT-10012348",
    customer: "Lisa & Hendra",
    paket: "Gold",
    wedding_date: "2025-07-30",
    location: "Bali",
    konsep: "Beach Wedding",
    total_price: 45000000,
    admin_status: "in_event",
    label: "💒 Hari H",
    urgency: "none",
  },
];

// Vendor pending approval
const PENDING_VENDORS = [
  {
    id: 7,
    name: "Harmony Decor",
    category: "Dekorasi",
    since: "2024",
    status: "pending",
  },
  {
    id: 8,
    name: "Lens & Story",
    category: "Fotografer",
    since: "2023",
    status: "pending",
  },
];

// Peta warna status admin
const STATUS_STYLE = {
  waiting_dp: "bg-gray-100 text-gray-500",
  dp_failed: "bg-red-100 text-red-600",
  waiting_vendor: "bg-amber-100 text-amber-700 font-semibold",
  vendor_assigned: "bg-blue-100 text-blue-700",
  vendor_confirmed: "bg-teal-100 text-teal-700 font-semibold",
  vendor_rejected: "bg-red-100 text-red-600 font-semibold",
  tech_meeting_scheduled: "bg-purple-100 text-purple-700",
  preparation: "bg-indigo-100 text-indigo-700",
  in_event: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL = {
  waiting_dp: "Menunggu DP",
  dp_failed: "DP Gagal",
  waiting_vendor: "Pilih Vendor",
  vendor_assigned: "Menunggu Vendor",
  vendor_confirmed: "Vendor Konfirm",
  vendor_rejected: "Vendor Tolak",
  tech_meeting_scheduled: "Tech Meeting",
  preparation: "Persiapan",
  in_event: "Hari H",
  completed: "Selesai",
};

// ── Komponen quick-action card untuk booking urgent ──────────
function UrgentCard({ booking, onAction }) {
  const urgencyBorder =
    {
      high: "border-l-4 border-l-red-400",
      medium: "border-l-4 border-l-amber-400",
      low: "border-l-4 border-l-blue-400",
      none: "border-l-4 border-l-transparent",
    }[booking.urgency] || "";

  return (
    <div
      className={[
        "bg-white border border-[var(--color-cream-border)] p-4 hover:shadow-[var(--shadow-card)] transition-all",
        urgencyBorder,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)] truncate">
            {booking.customer}
          </p>
          <p className="text-[10px] font-mono text-[var(--color-gold)]">
            {booking.order_id}
          </p>
        </div>
        <span
          className={[
            "text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 font-[var(--font-sans)]",
            STATUS_STYLE[booking.admin_status],
          ].join(" ")}
        >
          {STATUS_LABEL[booking.admin_status]}
        </span>
      </div>

      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mb-1">
        📍 {booking.location} · 🎨 {booking.konsep}
      </p>
      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mb-3">
        📅 {booking.wedding_date} · {formatRupiah(booking.total_price)}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-dark-muted)] font-[var(--font-sans)]">
          {booking.label}
        </span>
        <Link
          to="/admin/bookings"
          className="text-[10px] px-2.5 py-1 bg-[var(--color-gold)] text-[var(--color-dark)] font-medium font-[var(--font-sans)] hover:bg-[var(--color-gold-light)] transition-colors"
        >
          Proses →
        </Link>
      </div>
    </div>
  );
}

// ── Halaman utama ─────────────────────────────────────────────
function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const urgentCount = URGENT_BOOKINGS.filter(
    (b) => b.urgency === "high",
  ).length;
  const [vendorModal, setVendorModal] = useState(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-1">
            Panel Admin
          </p>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] mb-1">
            Selamat datang, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
            AMARANTA Wedding Organizer — ringkasan hari ini
          </p>
        </div>
        {/* Tanggal */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Alert: booking butuh tindakan segera */}
      {urgentCount > 0 && (
        <div className="mb-6 flex items-center justify-between px-5 py-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-bold text-sm">
                {urgentCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800 font-[var(--font-sans)]">
                {urgentCount} booking butuh tindakan segera
              </p>
              <p className="text-xs text-red-500 font-[var(--font-sans)]">
                Assign vendor atau pilih vendor pengganti
              </p>
            </div>
          </div>
          <Link
            to="/admin/bookings"
            className="flex-shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-widest font-[var(--font-sans)] transition-colors"
          >
            Tangani Sekarang
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Kiri: Booking butuh aksi (2/3 lebar) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-display)] text-xl text-[var(--color-dark)]">
              Booking Perlu Aksi
            </h2>
            <Link
              to="/admin/bookings"
              className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {URGENT_BOOKINGS.map((b) => (
              <UrgentCard key={b.id} booking={b} />
            ))}
          </div>
        </div>

        {/* Kanan: Vendor pending approval (1/3 lebar) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-display)] text-xl text-[var(--color-dark)]">
              Vendor Pending
            </h2>
            <Link
              to="/admin/vendors"
              className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
            >
              Kelola →
            </Link>
          </div>

          {PENDING_VENDORS.length === 0 ? (
            <div className="bg-white border border-[var(--color-cream-border)] p-5 text-center">
              <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
                Semua vendor sudah di-review ✓
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {PENDING_VENDORS.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-[var(--color-cream-border)] p-4 hover:border-[var(--color-gold)]/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
                        {v.name}
                      </p>
                      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                        {v.category} · Sejak {v.since}
                      </p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-[var(--font-sans)] flex-shrink-0">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        setVendorModal({ ...v, action: "approve" })
                      }
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-[var(--font-sans)] transition-colors"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => setVendorModal({ ...v, action: "reject" })}
                      className="flex-1 py-1.5 bg-[var(--color-cream)] border border-[var(--color-cream-border)] hover:border-red-300 text-[var(--color-dark-muted)] text-xs font-[var(--font-sans)] transition-colors"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Akses cepat ke modul admin */}
          <div className="mt-6">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-3">
              Akses Cepat
            </h3>
            <div className="space-y-2">
              {[
                {
                  to: "/admin/bookings",
                  icon: "📋",
                  label: "Kelola Semua Booking",
                },
                { to: "/admin/vendors", icon: "🏢", label: "Kelola Vendor" },
                { to: "/admin/users", icon: "👥", label: "Kelola Pengguna" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white border border-[var(--color-cream-border)] hover:border-[var(--color-gold)]/50 hover:bg-[var(--color-gold-pale)] transition-all group"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs text-[var(--color-dark)] font-[var(--font-sans)] group-hover:text-[var(--color-gold)] transition-colors">
                    {item.label}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-[var(--color-slate)] ml-auto group-hover:text-[var(--color-gold)] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel ringkasan semua booking */}
      <div className="bg-white border border-[var(--color-cream-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-cream-border)] flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl text-[var(--color-dark)]">
            Semua Booking
          </h2>
          <Link
            to="/admin/bookings"
            className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
          >
            Kelola & Filter →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-[var(--font-sans)]">
            <thead>
              <tr className="border-b border-[var(--color-cream-border)] bg-[var(--color-cream)]">
                {[
                  "Order ID",
                  "Customer",
                  "Paket",
                  "Tgl. Acara",
                  "Lokasi",
                  "Nilai",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--color-slate)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_BOOKINGS.map((b, i) => (
                <tr
                  key={b.id}
                  className={[
                    "border-b border-[var(--color-cream-border)] last:border-0 hover:bg-[var(--color-cream)] transition-colors",
                    i % 2 === 0 ? "" : "bg-[var(--color-ivory)]",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-gold)]">
                    {b.order_id}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--color-dark)]">
                    {b.customer}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "text-xs px-2 py-0.5 rounded",
                        {
                          Silver: "bg-gray-100 text-gray-600",
                          Gold: "bg-amber-50 text-amber-700",
                          Platinum: "bg-purple-50 text-purple-700",
                        }[b.paket] || "",
                      ].join(" ")}
                    >
                      {b.paket}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-dark-muted)]">
                    {b.wedding_date}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-slate)] max-w-[120px] truncate">
                    {b.location}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-dark)]">
                    {formatRupiah(b.total_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "text-[10px] px-2 py-0.5 rounded font-[var(--font-sans)]",
                        STATUS_STYLE[b.admin_status] ||
                          "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {STATUS_LABEL[b.admin_status] || b.admin_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal approve/reject vendor */}
      <Modal
        isOpen={!!vendorModal}
        onClose={() => setVendorModal(null)}
        title={
          vendorModal?.action === "approve" ? "Setujui Vendor" : "Tolak Vendor"
        }
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVendorModal(null)}
            >
              Batal
            </Button>
            <Button
              variant={vendorModal?.action === "approve" ? "gold" : "danger"}
              size="sm"
              onClick={() => {
                // nanti: adminService.approveVendor(vendorModal.id) atau rejectVendor
                setVendorModal(null);
              }}
            >
              {vendorModal?.action === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
            </Button>
          </>
        }
      >
        {vendorModal && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
              {vendorModal.action === "approve"
                ? `Anda akan menyetujui vendor "${vendorModal.name}". Vendor akan aktif dan bisa menerima request booking.`
                : `Anda akan menolak vendor "${vendorModal.name}". Vendor tidak bisa menerima booking.`}
            </p>
            <div className="p-3 bg-[var(--color-cream)] border border-[var(--color-cream-border)]">
              <p className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
                {vendorModal.name}
              </p>
              <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                {vendorModal.category} · Sejak {vendorModal.since}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
