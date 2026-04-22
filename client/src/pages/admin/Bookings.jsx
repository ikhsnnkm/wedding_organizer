import { useState, useEffect, useCallback } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { adminService, vendorService } from "../../services";
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

// ── Panel workflow per booking ────────────────────────────────
function WorkflowPanel({ booking, vendors, onUpdated }) {
  const s = booking.admin_status;
  const [assignVendorId, setAssignVendorId] = useState("");
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || "");
  const [techForm, setTechForm] = useState({
    tech_meeting_at: "",
    tech_meeting_location: "",
    tech_meeting_notes: "",
  });
  const [prepPct, setPrepPct] = useState(booking.preparation_progress || 0);
  const [acting, setActing] = useState(false);

  async function doAssign() {
    if (!assignVendorId) return;
    setActing(true);
    try {
      await adminService.assignVendor(booking.id, {
        vendor_id: Number(assignVendorId),
        admin_notes: adminNotes,
      });
      onUpdated();
    } catch (err) {
      alert(err.userMessage || "Gagal assign vendor");
    } finally {
      setActing(false);
    }
  }

  async function doReassign() {
    if (!assignVendorId) return;
    setActing(true);
    try {
      await adminService.reassignVendor(booking.id, {
        vendor_id: Number(assignVendorId),
      });
      onUpdated();
    } catch (err) {
      alert(err.userMessage || "Gagal reassign vendor");
    } finally {
      setActing(false);
    }
  }

  async function doTechMeeting() {
    if (!techForm.tech_meeting_at || !techForm.tech_meeting_location) {
      alert("Tanggal dan lokasi wajib diisi");
      return;
    }
    setActing(true);
    try {
      await adminService.setTechMeeting(booking.id, techForm);
      onUpdated();
    } catch (err) {
      alert(err.userMessage || "Gagal atur tech meeting");
    } finally {
      setActing(false);
    }
  }

  async function doConfirmTech() {
    setActing(true);
    try {
      await adminService.confirmTech(booking.id);
      onUpdated();
    } catch (err) {
      alert(err.userMessage || "Gagal");
    } finally {
      setActing(false);
    }
  }

  async function doUpdatePrep() {
    setActing(true);
    try {
      await adminService.updatePreparation(booking.id, prepPct);
      onUpdated();
    } catch (err) {
      alert(err.userMessage || "Gagal");
    } finally {
      setActing(false);
    }
  }

  async function doExecute() {
    if (!window.confirm("Tandai acara sedang berlangsung?")) return;
    setActing(true);
    try {
      await adminService.executeEvent(booking.id);
      onUpdated();
    } catch (err) {
      alert(
        err.userMessage || "Gagal eksekusi. Pastikan pembayaran sudah lunas.",
      );
    } finally {
      setActing(false);
    }
  }

  const STEPS = [
    "Bayar",
    "Pilih Vendor",
    "Tech Meeting",
    "Persiapan",
    "Eksekusi",
  ];
  const STEP_STATUS = [
    "waiting_vendor",
    "vendor_assigned",
    "vendor_confirmed",
    "tech_meeting_scheduled",
    "preparation",
    "in_event",
  ];
  const curIdx = STEP_STATUS.indexOf(s);

  return (
    <div className="mt-5 border-t border-[var(--color-cream-border)] pt-5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)]">
        Workflow WO
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <span
              className={[
                "text-[10px] px-2 py-0.5 rounded font-[var(--font-sans)]",
                i <= curIdx
                  ? "bg-[var(--color-gold)] text-[var(--color-dark)]"
                  : "bg-[var(--color-cream-border)] text-[var(--color-slate)]",
              ].join(" ")}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-[var(--color-cream-border)] text-xs">
                ›
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Assign vendor */}
      {(s === "waiting_vendor" || s === "vendor_rejected") && (
        <div className="space-y-3 p-4 bg-[var(--color-cream)] border border-[var(--color-cream-border)]">
          <p className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
            {s === "vendor_rejected"
              ? "🔄 Pilih Vendor Pengganti"
              : "👤 Assign Vendor"}
          </p>
          <select
            value={assignVendorId}
            onChange={(e) => setAssignVendorId(e.target.value)}
            className="w-full border border-[var(--color-cream-border)] px-3 py-2 text-sm font-[var(--font-sans)] outline-none focus:border-[var(--color-gold)] bg-white"
          >
            <option value="">-- Pilih vendor --</option>
            {vendors
              .filter((v) => v.status === "approved")
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.category || "Umum"})
                </option>
              ))}
          </select>
          <Input
            label="Catatan untuk Vendor (opsional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <Button
            size="sm"
            variant="gold"
            isLoading={acting}
            disabled={!assignVendorId}
            onClick={s === "vendor_rejected" ? doReassign : doAssign}
          >
            {s === "vendor_rejected" ? "Assign Vendor Baru" : "Assign Vendor"}
          </Button>
        </div>
      )}

      {/* Tech meeting */}
      {s === "vendor_confirmed" && (
        <div className="space-y-3 p-4 bg-[var(--color-cream)] border border-[var(--color-cream-border)]">
          <p className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
            📅 Jadwalkan Tech Meeting
          </p>
          <Input
            label="Tanggal & Waktu"
            type="datetime-local"
            value={techForm.tech_meeting_at}
            onChange={(e) =>
              setTechForm((p) => ({ ...p, tech_meeting_at: e.target.value }))
            }
          />
          <Input
            label="Lokasi Meeting"
            value={techForm.tech_meeting_location}
            onChange={(e) =>
              setTechForm((p) => ({
                ...p,
                tech_meeting_location: e.target.value,
              }))
            }
            placeholder="Zoom / Kantor AMARANTA / ..."
          />
          <Input
            label="Catatan (opsional)"
            value={techForm.tech_meeting_notes}
            onChange={(e) =>
              setTechForm((p) => ({ ...p, tech_meeting_notes: e.target.value }))
            }
          />
          <Button
            size="sm"
            variant="gold"
            isLoading={acting}
            onClick={doTechMeeting}
          >
            Jadwalkan
          </Button>
        </div>
      )}

      {/* Konfirmasi tech meeting */}
      {s === "tech_meeting_scheduled" && (
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200">
          <div>
            <p className="text-xs font-medium text-purple-800 font-[var(--font-sans)]">
              Tech Meeting:{" "}
              {booking.tech_meeting_at
                ? new Date(booking.tech_meeting_at).toLocaleString("id-ID")
                : "—"}
            </p>
            <p className="text-xs text-purple-600 font-[var(--font-sans)]">
              Lokasi: {booking.tech_meeting_location || "—"}
            </p>
          </div>
          <Button
            size="sm"
            variant="gold"
            isLoading={acting}
            onClick={doConfirmTech}
          >
            ✅ Konfirmasi Sudah Terlaksana
          </Button>
        </div>
      )}

      {/* Update progress */}
      {s === "preparation" && (
        <div className="space-y-3 p-4 bg-[var(--color-cream)] border border-[var(--color-cream-border)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
              📊 Progress Persiapan: {prepPct}%
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={prepPct}
            onChange={(e) => setPrepPct(Number(e.target.value))}
            className="w-full"
          />
          <div className="h-2 bg-[var(--color-cream-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-gold)] rounded-full transition-all"
              style={{ width: prepPct + "%" }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              isLoading={acting}
              onClick={doUpdatePrep}
            >
              Simpan Progress
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={acting}
              onClick={doExecute}
            >
              🚀 Eksekusi Acara
            </Button>
          </div>
        </div>
      )}

      {/* Info detail acara */}
      <div className="grid grid-cols-2 gap-2 text-xs font-[var(--font-sans)]">
        {[
          { l: "Tgl. Nikah", v: booking.wedding_date },
          { l: "Lokasi", v: booking.location },
          { l: "Konsep", v: booking.konsep },
          { l: "Total", v: formatRupiah(booking.total_price) },
        ]
          .filter((x) => x.v)
          .map(({ l, v }) => (
            <div key={l}>
              <span className="text-[var(--color-slate)]">{l}: </span>
              <span className="text-[var(--color-dark)] font-medium">{v}</span>
            </div>
          ))}
      </div>

      {/* Riwayat vendor request */}
      {booking.vendor_requests?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-2">
            Riwayat Vendor
          </p>
          {booking.vendor_requests.map((vr, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-1.5 border-b border-[var(--color-cream-border)] last:border-0"
            >
              <span
                className={[
                  "text-[10px] px-2 py-0.5 rounded font-[var(--font-sans)]",
                  vr.status === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : vr.status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700",
                ].join(" ")}
              >
                {vr.status}
              </span>
              <span className="text-xs text-[var(--color-dark)] font-[var(--font-sans)]">
                {vr.vendor?.name || "—"}
              </span>
              {vr.rejection_reason && (
                <span className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] truncate">
                  — {vr.rejection_reason}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Halaman Utama ─────────────────────────────────────────────
export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const PER_PAGE = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, vData] = await Promise.all([
        adminService.getBookings(),
        adminService.getVendors(),
      ]);
      // Paginate response sudah di-extract oleh service helper (d = r => r.data?.data ?? r.data)
      // tapi paginate mengembalikan { data:[...], links, meta }
      // sehingga r.data = full object, r.data.data = array items
      const bookArr = Array.isArray(bData) ? bData : bData?.data || [];
      const vendArr = Array.isArray(vData) ? vData : vData?.data || [];
      setBookings(bookArr);
      setVendors(vendArr);
    } catch (err) {
      console.error("Admin Bookings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh detail jika sedang dibuka

  const needAction = bookings.filter((b) =>
    ["waiting_vendor", "vendor_rejected", "vendor_confirmed"].includes(
      b.admin_status,
    ),
  ).length;

  const filtered = bookings
    .filter((b) => filter === "all" || b.admin_status === filter)
    .filter(
      (b) =>
        !search ||
        b.order_id?.includes(search) ||
        b.pemesan_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.location?.toLowerCase().includes(search.toLowerCase()),
    );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] mb-1">
          Manajemen Booking
        </h1>
        <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
          Kelola booking sebagai Wedding Organizer — assign vendor, tech
          meeting, persiapan.
        </p>
      </div>

      {/* Alert butuh aksi */}
      {needAction > 0 && (
        <div className="mb-5 flex items-center justify-between px-5 py-4 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
              {needAction}
            </span>
            <p className="text-sm font-medium text-amber-800 font-[var(--font-sans)]">
              {needAction} booking perlu tindakan Anda
            </p>
          </div>
          <button
            onClick={() => {
              setFilter("waiting_vendor");
              setPage(1);
            }}
            className="text-xs text-amber-700 hover:underline font-[var(--font-sans)]"
          >
            Lihat →
          </button>
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari order ID, nama, lokasi..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-[var(--color-cream-border)] bg-white text-sm font-[var(--font-sans)] outline-none focus:border-[var(--color-gold)] transition-colors"
        />
        {[
          { val: "all", label: "Semua" },
          { val: "waiting_vendor", label: "Pilih Vendor" },
          { val: "vendor_assigned", label: "Menunggu Vendor" },
          { val: "vendor_confirmed", label: "Vendor Konfirm" },
          { val: "preparation", label: "Persiapan" },
          { val: "in_event", label: "Hari H" },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => {
              setFilter(f.val);
              setPage(1);
            }}
            className={[
              "px-3 py-2 text-xs uppercase tracking-widest font-[var(--font-sans)] border transition-all",
              filter === f.val
                ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                : "bg-white border-[var(--color-cream-border)] text-[var(--color-dark-muted)] hover:border-[var(--color-dark)]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white border border-[var(--color-cream-border)] overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-[var(--font-sans)]">
                <thead>
                  <tr className="bg-[var(--color-cream)] border-b border-[var(--color-cream-border)]">
                    {[
                      "Order",
                      "Pemesan",
                      "Paket",
                      "Tgl Acara",
                      "Lokasi",
                      "Vendor",
                      "Status",
                      "Progress",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--color-slate)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-[var(--color-cream-border)] last:border-0 hover:bg-[var(--color-cream)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-[var(--color-gold)]">
                          {b.order_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--color-dark)]">
                          {b.pemesan_name}
                        </p>
                        <p className="text-xs text-[var(--color-slate)]">
                          {b.pemesan_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded capitalize",
                            {
                              silver: "bg-gray-100 text-gray-600",
                              gold: "bg-amber-50 text-amber-700",
                              platinum: "bg-purple-50 text-purple-700",
                            }[b.package?.tier_id] ||
                              "bg-gray-100 text-gray-600",
                          ].join(" ")}
                        >
                          {b.package?.tier_id || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-dark-muted)] whitespace-nowrap">
                        {b.wedding_date || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate)] max-w-[120px] truncate">
                        {b.location || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-dark-muted)]">
                        {b.vendor?.name || (
                          <span className="text-[var(--color-slate)] italic">
                            Belum
                          </span>
                        )}
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
                      <td className="px-4 py-3">
                        {b.preparation_progress > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[var(--color-cream-border)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-gold)] rounded-full"
                                style={{ width: b.preparation_progress + "%" }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--color-slate)] font-[var(--font-sans)]">
                              {b.preparation_progress}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetail(b)}
                          className="text-xs px-3 py-1.5 border border-[var(--color-cream-border)] text-[var(--color-dark-muted)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] font-[var(--font-sans)] transition-all whitespace-nowrap"
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filtered.length === 0 && (
            <p className="text-center py-12 text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
              Tidak ada booking ditemukan.
            </p>
          )}

          {/* Paginasi */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "w-8 h-8 text-xs font-[var(--font-sans)] border transition-all",
                    page === p
                      ? "bg-[var(--color-dark)] text-[var(--color-cream)] border-[var(--color-dark)]"
                      : "border-[var(--color-cream-border)] text-[var(--color-dark-muted)] hover:border-[var(--color-dark)]",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal detail + workflow */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.order_id + " — " + detail.pemesan_name : ""}
        size="xl"
      >
        {detail && (
          <div>
            {/* Info booking */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
              {[
                { l: "Paket", v: detail.package?.tier_id },
                { l: "Tgl Nikah", v: detail.wedding_date },
                { l: "Lokasi", v: detail.location },
                { l: "Konsep", v: detail.konsep },
                { l: "Total", v: formatRupiah(detail.total_price) },
                { l: "HP", v: detail.pemesan_phone },
              ]
                .filter((x) => x.v)
                .map(({ l, v }) => (
                  <div
                    key={l}
                    className="border border-[var(--color-cream-border)] p-3"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)]">
                      {l}
                    </p>
                    <p className="text-sm font-medium text-[var(--color-dark)] font-[var(--font-sans)] capitalize">
                      {v}
                    </p>
                  </div>
                ))}
            </div>
            {detail.notes && (
              <div className="mb-2 px-3 py-2 bg-[var(--color-cream)] border border-[var(--color-cream-border)]">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-1">
                  Catatan
                </p>
                <p className="text-xs text-[var(--color-dark-muted)] font-[var(--font-sans)]">
                  {detail.notes}
                </p>
              </div>
            )}

            <WorkflowPanel
              booking={detail}
              vendors={vendors}
              onUpdated={async () => {
                await load();
                // Refresh detail dengan data terbaru
                const fresh = await adminService.getBookings();
                const arr = Array.isArray(fresh) ? fresh : fresh.data || [];
                const updated = arr.find((b) => b.id === detail.id);
                if (updated) setDetail(updated);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
