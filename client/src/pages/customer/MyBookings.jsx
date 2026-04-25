import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import useAuthStore from "../../store/authStore";
import { bookingService } from "../../services";
import { toastSuccess, toastError } from "../../hooks/useToast";
import { formatRupiah } from "../../data/packages";

// Alur: Dipesan → Bayar DP → Admin Proses → Lunasi → Hari H → Selesai
const PHASES = [
  {
    id: "pending",
    label: "Dipesan",
    icon: (
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    id: "dp_paid",
    label: "DP Lunas",
    icon: (
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
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    id: "vendor_process",
    label: "Diproses",
    icon: (
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "in_event",
    label: "Hari H",
    icon: (
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
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    id: "rated",
    label: "Selesai",
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const ADMIN_MSG = {
  waiting_dp: {
    text: "⏳ Silakan bayar DP 30% untuk memulai proses pernikahan Anda.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  payment_failed: {
    text: "❌ Pembayaran gagal. Silakan coba lagi.",
    color: "bg-red-50 border-red-200 text-red-600",
  },
  waiting_payment: {
    text: "⏳ Silakan bayar DP 30% untuk memulai proses pernikahan Anda.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  waiting_vendor: {
    text: "✅ DP diterima! Admin sedang memilih vendor terbaik untuk Anda.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  vendor_assigned: {
    text: "📨 Vendor sudah dipilih, menunggu konfirmasi vendor.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  vendor_confirmed: {
    text: "✅ Vendor dikonfirmasi! Admin akan menjadwalkan tech meeting.",
    color: "bg-teal-50 border-teal-200 text-teal-700",
  },
  vendor_rejected: {
    text: "🔄 Admin sedang mencari vendor pengganti untuk Anda.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  tech_meeting_scheduled: {
    text: "📅 Tech meeting dijadwalkan — tim AMARANTA akan menghubungi Anda.",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  preparation: {
    text: "🎪 Persiapan acara berjalan. Silakan lunasi sisa pembayaran (70%).",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  in_event: {
    text: "💒 Selamat menjalani hari istimewa Anda!",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  completed: {
    text: "🎉 Acara selesai. Terima kasih telah mempercayai AMARANTA!",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
};

function PhaseBar({ phase, adminStatus }) {
  // Mapping phase + admin_status ke step 1-5
  function getStep() {
    if (adminStatus === "waiting_payment" || phase === "pending") return 1;
    if (adminStatus === "payment_failed") return 1;
    if (phase === "paid" && adminStatus === "waiting_vendor") return 2;
    if (
      [
        "vendor_assigned",
        "vendor_confirmed",
        "vendor_rejected",
        "tech_meeting_scheduled",
        "preparation",
      ].includes(adminStatus)
    )
      return 3;
    if (phase === "in_event" || adminStatus === "in_event") return 4;
    if (phase === "rated" || adminStatus === "completed") return 5;
    // Fallback
    const m = { pending: 1, paid: 2, in_event: 4, rated: 5 };
    return m[phase] || 1;
  }
  const cur = getStep();

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {PHASES.map((p, i) => {
        const done = i + 1 < cur;
        const current = i + 1 === cur;
        return (
          <div key={p.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[48px]">
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all",
                  done
                    ? "bg-[var(--color-dark)] text-[var(--color-cream)]"
                    : current
                      ? "bg-[var(--color-gold)] text-[var(--color-dark)] shadow-[var(--shadow-gold)]"
                      : "bg-[var(--color-cream-border)] text-[var(--color-slate)]",
                ].join(" ")}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : typeof p.icon === "string" ? (
                  p.icon
                ) : (
                  p.icon
                )}
              </div>
              <span
                className={[
                  "text-[9px] uppercase tracking-widest text-center leading-tight font-[var(--font-sans)]",
                  current
                    ? "text-[var(--color-gold)] font-bold"
                    : done
                      ? "text-[var(--color-dark-muted)]"
                      : "text-[var(--color-slate)]",
                ].join(" ")}
              >
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={[
                  "h-0.5 w-4 -mt-5",
                  i + 1 < cur
                    ? "bg-[var(--color-dark)]"
                    : "bg-[var(--color-cream-border)]",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHov(s)}
          onMouseLeave={() => onChange && setHov(0)}
          className={[
            "text-2xl transition-colors",
            s <= (hov || value)
              ? "text-[var(--color-gold)]"
              : "text-[var(--color-cream-border)]",
            onChange ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function CustomerMyBookings() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  // Modal states
  const [ratingModal, setRatingModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [acting, setActing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function loadBookings() {
    setLoading(true);
    bookingService
      .getMy()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setFetchErr("Gagal memuat data. Coba refresh halaman."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
    // Auto refresh saat tab kembali difokus (misal setelah bayar di Midtrans)
    function onFocus() {
      loadBookings();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function handlePayFull(booking) {
    try {
      const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
      const token =
        sessionStorage.getItem("amaranta_token") ||
        localStorage.getItem("amaranta_token");
      const res = await fetch(`${API}/bookings/${booking.id}/pay-full`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Belum bisa lunasi sekarang.");
        return;
      }
      // Buka Midtrans Snap
      if (typeof window.snap !== "undefined") {
        window.snap.pay(data.snap_token, {
          onSuccess: () => loadBookings(),
          onPending: () => {},
          onClose: () => {},
        });
      } else {
        alert("Mode dev: pelunasan dicatat. Refresh halaman.");
        loadBookings();
      }
    } catch (err) {
      alert("Tidak bisa terhubung ke server.");
    }
  }

  async function handleCancel() {
    if (!cancelModal) return;
    setActing(true);
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API}/bookings/${cancelModal.id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization:
            "Bearer " + (localStorage.getItem("amaranta_token") || ""),
        },
      });
      if (res.ok) {
        setBookings((p) =>
          p.map((b) =>
            b.id === cancelModal.id
              ? { ...b, status: "cancelled", admin_status: "cancelled" }
              : b,
          ),
        );
        toastSuccess("Booking berhasil dibatalkan.");
        setCancelModal(null);
      } else {
        const d = await res.json();
        toastError(d.message || "Gagal membatalkan booking.");
      }
    } catch {
      toastError("Tidak bisa terhubung ke server.");
    } finally {
      setActing(false);
    }
  }

  async function handleRating() {
    if (!ratingModal) return;
    setActing(true);
    try {
      await bookingService.rate(ratingModal.id, {
        rating: ratingValue,
        review: reviewText,
      });
      setBookings((p) =>
        p.map((b) =>
          b.id === ratingModal.id
            ? { ...b, phase: "rated", rating: ratingValue }
            : b,
        ),
      );
      toastSuccess("Terima kasih atas penilaian Anda!");
      setRatingModal(null);
      setRatingValue(5);
      setReviewText("");
    } catch {
      toastError("Gagal menyimpan penilaian.");
    } finally {
      setActing(false);
    }
  }

  // Apakah booking bisa di-reschedule?
  // Hanya sebelum vendor confirmed

  // Bisa batalkan hanya jika belum bayar
  function canCancel(b) {
    return (
      ["waiting_payment", "payment_failed"].includes(b.admin_status) &&
      b.status !== "cancelled"
    );
  }

  if (loading)
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
          Memuat pemesanan...
        </p>
      </div>
    );

  if (fetchErr)
    return (
      <div className="px-5 py-4 bg-red-50 border border-red-200 text-sm text-red-600 font-[var(--font-sans)]">
        ⚠️ {fetchErr}
      </div>
    );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-2">
            Akun Saya
          </p>
          <h1 className="font-[var(--font-display)] text-4xl text-[var(--color-dark)] mb-1">
            Pemesanan Saya
          </h1>
          <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)]">
            Halo, {user?.name?.split(" ")[0]} — pantau semua status pemesanan
            Anda.
          </p>
        </div>
        <button
          onClick={loadBookings}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-[var(--color-cream-border)] text-xs text-[var(--color-dark-muted)] hover:border-[var(--color-gold)] font-[var(--font-sans)] transition-all mt-2"
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

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-[var(--font-display)] text-3xl text-[var(--color-dark-subtle)] mb-3">
            Belum ada pemesanan
          </p>
          <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)] mb-6">
            Pilih paket pernikahan impian Anda dan mulai pesan sekarang.
          </p>
          <Link
            to="/paket"
            className="inline-block px-8 py-3 bg-[var(--color-gold)] text-[var(--color-dark)] text-xs uppercase tracking-widest font-[var(--font-sans)] hover:bg-[var(--color-gold-light)] transition-colors"
          >
            Pilih Paket
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-[var(--color-cream-border)] overflow-hidden"
            >
              <div className="h-1 bg-[var(--color-gold)]" />
              <div className="p-5">
                {/* Header booking */}
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div>
                    <p className="font-[var(--font-display)] text-xl text-[var(--color-dark)] mb-0.5">
                      Paket {booking.package?.tier_id || "—"}
                      <span className="ml-2 text-sm text-[var(--color-slate)] font-[var(--font-sans)] normal-case">
                        AMARANTA Wedding Organizer
                      </span>
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                        📅 {booking.wedding_date || "—"}
                      </p>
                      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                        📍 {booking.location || "—"}
                      </p>
                      <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                        🎨 {booking.konsep || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-mono text-[var(--color-gold)]">
                        {booking.order_id}
                      </p>
                      {booking.status === "cancelled" && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 font-[var(--font-sans)] uppercase tracking-widest">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-[var(--font-display)] text-xl text-[var(--color-dark)] flex-shrink-0">
                    {formatRupiah(booking.total_price)}
                  </p>
                </div>

                {/* Info status dari admin */}
                {ADMIN_MSG[booking.admin_status] && (
                  <div
                    className={[
                      "mb-4 px-3 py-2 border text-xs font-[var(--font-sans)]",
                      ADMIN_MSG[booking.admin_status]?.color ||
                        "bg-[var(--color-cream)] border-[var(--color-cream-border)] text-[var(--color-dark-muted)]",
                    ].join(" ")}
                  >
                    {ADMIN_MSG[booking.admin_status]?.text}
                    {booking.vendor?.name &&
                      booking.admin_status === "vendor_confirmed" && (
                        <span className="ml-2 font-medium">
                          {" "}
                          {booking.vendor.name}
                        </span>
                      )}
                  </div>
                )}

                {/* Progress persiapan */}
                {booking.preparation_progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-[var(--font-sans)] mb-1">
                      <span className="text-[var(--color-slate)]">
                        Progress Persiapan
                      </span>
                      <span className="text-[var(--color-gold)]">
                        {booking.preparation_progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-cream-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-gold)] rounded-full transition-all"
                        style={{ width: booking.preparation_progress + "%" }}
                      />
                    </div>
                  </div>
                )}

                {/* Phase bar */}
                <div className="mb-4 pb-4 border-b border-[var(--color-cream-border)]">
                  <PhaseBar
                    phase={booking.phase}
                    adminStatus={booking.admin_status}
                  />
                </div>

                {/* Aksi */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Bayar DP — jika belum bayar DP */}
                  {(booking.admin_status === "waiting_dp" ||
                    booking.admin_status === "waiting_payment") && (
                    <a
                      href={"/pesan/" + booking.package?.tier_id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-gold)] text-[var(--color-dark)] text-xs font-[var(--font-sans)] hover:bg-[var(--color-gold-light)] transition-all"
                    >
                      💳 Bayar DP 30% —{" "}
                      {booking.total_price
                        ? formatRupiah(Math.round(booking.total_price * 0.3))
                        : ""}
                    </a>
                  )}

                  {/* Lunasi — hanya saat preparation + DP sudah bayar */}
                  {booking.admin_status === "preparation" &&
                    booking.phase === "dp_paid" && (
                      <button
                        onClick={() => handlePayFull(booking)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-[var(--font-sans)] hover:bg-emerald-700 transition-all"
                      >
                        💰 Lunasi Sisa 70% —{" "}
                        {booking.total_price
                          ? formatRupiah(Math.round(booking.total_price * 0.7))
                          : ""}
                      </button>
                    )}

                  {/* Invoice DP — muncul setelah DP terbayar */}
                  {["dp_paid", "paid", "in_event", "rated"].includes(
                    booking.phase,
                  ) && (
                    <Link
                      to={
                        "/pelanggan/invoice/" +
                        booking.id +
                        "?type=" +
                        (["paid", "in_event", "rated"].includes(booking.phase)
                          ? "full"
                          : "dp")
                      }
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 border border-[var(--color-cream-border)] text-xs text-[var(--color-dark-muted)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] font-[var(--font-sans)] transition-all"
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
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      {["paid", "in_event", "rated"].includes(booking.phase)
                        ? "Invoice Lunas"
                        : "Invoice DP"}
                    </Link>
                  )}

                  {/* Bayar ulang jika payment gagal */}
                  {booking.admin_status === "payment_failed" && (
                    <a
                      href={"/pesan/" + booking.package?.tier_id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-gold)] text-[var(--color-dark)] text-xs font-[var(--font-sans)] hover:bg-[var(--color-gold-light)] transition-all"
                    >
                      💳 Bayar Ulang
                    </a>
                  )}

                  {/* Batalkan — hanya sebelum bayar */}
                  {canCancel(booking) && (
                    <button
                      onClick={() => setCancelModal(booking)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-xs text-red-500 hover:bg-red-50 font-[var(--font-sans)] transition-all"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Batalkan
                    </button>
                  )}

                  {/* Beri rating */}
                  {booking.phase === "in_event" && !booking.rating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRatingModal(booking);
                        setRatingValue(5);
                        setReviewText("");
                      }}
                    >
                      ⭐ Beri Penilaian
                    </Button>
                  )}

                  {/* Rating sudah ada */}
                  {booking.rating && <StarRating value={booking.rating} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Batalkan */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Batalkan Booking"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelModal(null)}
            >
              Kembali
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={acting}
              onClick={handleCancel}
            >
              Ya, Batalkan
            </Button>
          </>
        }
      >
        {cancelModal && (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-red-50 border border-red-200">
              <p className="text-xs text-red-700 font-[var(--font-sans)]">
                ⚠️ Pembatalan booking tidak dapat dikembalikan.
              </p>
            </div>
            <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
              Yakin membatalkan booking <strong>{cancelModal.order_id}</strong>?
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Rating */}
      <Modal
        isOpen={!!ratingModal}
        onClose={() => setRatingModal(null)}
        title="Beri Penilaian"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRatingModal(null)}
            >
              Batal
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={acting}
              onClick={handleRating}
            >
              Kirim
            </Button>
          </>
        }
      >
        {ratingModal && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)] mb-3">
                Bagaimana pengalaman pernikahan Anda bersama AMARANTA?
              </p>
              <StarRating value={ratingValue} onChange={setRatingValue} />
              <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mt-1">
                {
                  ["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar Biasa!"][
                    ratingValue
                  ]
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                Ulasan
              </label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Ceritakan pengalaman Anda..."
                className="w-full border-b-2 border-[var(--color-cream-border)] focus:border-[var(--color-gold)] bg-transparent text-sm font-[var(--font-sans)] outline-none py-2 resize-none transition-colors"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
