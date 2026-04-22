import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import useAuthStore from "../../store/authStore";
import { adminService } from "../../services";
import { formatRupiah } from "../../data/packages";

const STATUS_STYLE = {
  waiting_payment: "bg-gray-100 text-gray-500",
  payment_failed: "bg-red-100 text-red-600",
  waiting_vendor: "bg-amber-100 text-amber-700",
  vendor_assigned: "bg-blue-100 text-blue-700",
  vendor_confirmed: "bg-teal-100 text-teal-700",
  vendor_rejected: "bg-red-100 text-red-600",
  tech_meeting_scheduled: "bg-purple-100 text-purple-700",
  preparation: "bg-indigo-100 text-indigo-700",
  in_event: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL = {
  waiting_payment: "Menunggu Bayar",
  payment_failed: "Bayar Gagal",
  waiting_vendor: "Pilih Vendor",
  vendor_assigned: "Menunggu Vendor",
  vendor_confirmed: "Vendor Konfirm",
  vendor_rejected: "Vendor Tolak",
  tech_meeting_scheduled: "Tech Meeting",
  preparation: "Persiapan",
  in_event: "Hari H",
  completed: "Selesai",
};

function UrgentCard({ booking }) {
  const urgencyBorder = ["waiting_vendor", "vendor_rejected"].includes(
    booking.admin_status,
  )
    ? "border-l-4 border-l-red-400"
    : ["vendor_confirmed", "tech_meeting_scheduled"].includes(
          booking.admin_status,
        )
      ? "border-l-4 border-l-amber-400"
      : "border-l-4 border-l-blue-400";

  const actionLabel =
    {
      waiting_vendor: "⚡ Assign Vendor",
      vendor_rejected: "🔄 Pilih Vendor Lain",
      vendor_confirmed: "📅 Jadwalkan Tech Meeting",
      tech_meeting_scheduled: "✅ Konfirmasi Tech Meeting",
      preparation: "📊 Update Persiapan",
    }[booking.admin_status] || "Proses";

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
            {booking.pemesan_name}
          </p>
          <p className="text-[10px] font-mono text-[var(--color-gold)]">
            {booking.order_id}
          </p>
        </div>
        <span
          className={[
            "text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 font-[var(--font-sans)]",
            STATUS_STYLE[booking.admin_status] || "bg-gray-100 text-gray-500",
          ].join(" ")}
        >
          {STATUS_LABEL[booking.admin_status] || booking.admin_status}
        </span>
      </div>
      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mb-1 truncate">
        📍 {booking.location || "—"} · 🎨 {booking.konsep || "—"}
      </p>
      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mb-3">
        📅 {booking.wedding_date} · {formatRupiah(booking.total_price)}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-dark-muted)] font-[var(--font-sans)]">
          {actionLabel}
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

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState(null);
  const [urgentBookings, setUrgentBookings] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorModal, setVendorModal] = useState(null);
  const [acting, setActing] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [statsData, urgentData, pendingData, allData] = await Promise.all([
        adminService.getStats(),
        adminService.getBookings({
          admin_status:
            "waiting_vendor,vendor_rejected,vendor_confirmed,tech_meeting_scheduled,preparation",
        }),
        adminService.getVendors({ status: "pending" }),
        adminService.getBookings(),
      ]);

      setStats(statsData);

      const urgent = Array.isArray(urgentData)
        ? urgentData
        : urgentData?.data || [];
      setUrgentBookings(
        urgent
          .filter((b) =>
            [
              "waiting_vendor",
              "vendor_rejected",
              "vendor_confirmed",
              "tech_meeting_scheduled",
              "preparation",
            ].includes(b.admin_status),
          )
          .slice(0, 6),
      );

      const pending = Array.isArray(pendingData)
        ? pendingData
        : pendingData?.data || [];
      setPendingVendors(pending);

      const all = Array.isArray(allData) ? allData : allData?.data || [];
      setAllBookings(all.slice(0, 10));
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleVendorAction(vendor, action) {
    setActing(true);
    try {
      if (action === "approve") await adminService.approveVendor(vendor.id);
      else await adminService.rejectVendor(vendor.id);
      setPendingVendors((p) => p.filter((v) => v.id !== vendor.id));
      setVendorModal(null);
    } catch {
    } finally {
      setActing(false);
    }
  }

  const needAction = urgentBookings.filter((b) =>
    ["waiting_vendor", "vendor_rejected"].includes(b.admin_status),
  ).length;

  const statCards = stats
    ? [
        {
          title: "Booking Aktif",
          value: stats.active_bookings || 0,
          subtitle: "sedang berjalan",
        },
        {
          title: "Perlu Tindakan",
          value: needAction,
          subtitle: "assign vendor",
        },
        {
          title: "Total Revenue",
          value: formatRupiah(stats.total_revenue_paid || 0),
          subtitle: "sudah dibayar",
        },
        {
          title: "Vendor Aktif",
          value: stats.total_vendors || 0,
          subtitle: `${stats.pending_vendors || 0} pending`,
        },
      ]
    : Array(4).fill({ title: "...", value: "—", subtitle: "" });

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );

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
            AMARANTA Wedding Organizer
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-cream-border)] text-xs text-[var(--color-dark-muted)] hover:border-[var(--color-gold)] font-[var(--font-sans)] transition-all"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div
            key={s.title}
            className="bg-white border border-[var(--color-cream-border)] p-5"
          >
            <p className="text-xs uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-2">
              {s.title}
            </p>
            <p className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] mb-1">
              {s.value}
            </p>
            <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
              {s.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Alert */}
      {needAction > 0 && (
        <div className="mb-6 flex items-center justify-between px-5 py-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">
              {needAction}
            </span>
            <p className="text-sm font-medium text-red-800 font-[var(--font-sans)]">
              {needAction} booking butuh tindakan segera
            </p>
          </div>
          <Link
            to="/admin/bookings"
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-widest font-[var(--font-sans)] transition-colors"
          >
            Tangani
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Urgent Bookings */}
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
          {urgentBookings.length === 0 ? (
            <div className="bg-white border border-[var(--color-cream-border)] p-8 text-center">
              <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
                Tidak ada booking yang perlu ditangani ✓
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {urgentBookings.map((b) => (
                <UrgentCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </div>

        {/* Pending Vendors + Quick Access */}
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

          {pendingVendors.length === 0 ? (
            <div className="bg-white border border-[var(--color-cream-border)] p-5 text-center mb-4">
              <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
                Semua vendor sudah di-review ✓
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {pendingVendors.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-[var(--color-cream-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
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
                  <div className="flex gap-2">
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

          {/* Quick Access */}
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-3">
            Akses Cepat
          </h3>
          <div className="space-y-2">
            {[
              { to: "/admin/bookings", icon: "📋", label: "Kelola Booking" },
              { to: "/admin/vendors", icon: "🏢", label: "Kelola Vendor" },
              { to: "/admin/users", icon: "👥", label: "Kelola Pengguna" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2.5 bg-white border border-[var(--color-cream-border)] hover:border-[var(--color-gold)]/50 transition-all group"
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-xs text-[var(--color-dark)] font-[var(--font-sans)] group-hover:text-[var(--color-gold)] transition-colors">
                  {item.label}
                </span>
                <svg
                  className="w-3.5 h-3.5 text-[var(--color-slate)] ml-auto"
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

      {/* Semua Booking */}
      <div className="bg-white border border-[var(--color-cream-border)]">
        <div className="px-5 py-4 border-b border-[var(--color-cream-border)] flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl text-[var(--color-dark)]">
            Booking Terbaru
          </h2>
          <Link
            to="/admin/bookings"
            className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
          >
            Lihat semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-[var(--font-sans)]">
            <thead>
              <tr className="bg-[var(--color-cream)] border-b border-[var(--color-cream-border)]">
                {[
                  "Order ID",
                  "Pemesan",
                  "Paket",
                  "Tgl Acara",
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
              {allBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center px-4 py-8 text-sm text-[var(--color-slate)]"
                  >
                    Belum ada booking
                  </td>
                </tr>
              ) : (
                allBookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--color-cream-border)] last:border-0 hover:bg-[var(--color-cream)] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-gold)]">
                      {b.order_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-dark)]">
                      {b.pemesan_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "text-xs px-2 py-0.5 rounded capitalize",
                          {
                            silver: "bg-gray-100 text-gray-600",
                            gold: "bg-amber-50 text-amber-700",
                            platinum: "bg-purple-50 text-purple-700",
                          }[b.package?.tier_id] || "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {b.package?.tier_id || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-dark-muted)]">
                      {b.wedding_date}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-dark)]">
                      {formatRupiah(b.total_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "text-[10px] px-2 py-0.5 rounded",
                          STATUS_STYLE[b.admin_status] ||
                            "bg-gray-100 text-gray-500",
                        ].join(" ")}
                      >
                        {STATUS_LABEL[b.admin_status] || b.admin_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal vendor approve/reject */}
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
              isLoading={acting}
              onClick={() =>
                handleVendorAction(vendorModal, vendorModal.action)
              }
            >
              {vendorModal?.action === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
            </Button>
          </>
        }
      >
        {vendorModal && (
          <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
            {vendorModal.action === "approve"
              ? `Setujui vendor "${vendorModal.name}"? Vendor akan aktif.`
              : `Tolak vendor "${vendorModal.name}"?`}
          </p>
        )}
      </Modal>
    </div>
  );
}
