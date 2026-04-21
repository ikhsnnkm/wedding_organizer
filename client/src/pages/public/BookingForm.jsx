// ============================================================
// src/pages/public/BookingForm.jsx
// Form pemesanan langsung — tanpa cart
// Flow: pilih paket → form → Midtrans Snap → sukses → invoice
// ============================================================
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import useAuthStore from "../../store/authStore";
import { PACKAGES, AMARANTA_INFO, formatRupiah } from "../../data/packages";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const snapReady = () =>
  typeof window !== "undefined" && typeof window.snap !== "undefined";

const fCls = (err) =>
  [
    "w-full border-b-2 bg-transparent py-2 text-sm font-[var(--font-sans)] text-[var(--color-dark)] outline-none transition-colors",
    err
      ? "border-red-400"
      : "border-[var(--color-cream-border)] focus:border-[var(--color-gold)]",
  ].join(" ");

const PAYMENT_METHODS = [
  { id: "bca", name: "BCA Virtual Account", icon: "🏦", group: "Transfer" },
  {
    id: "mandiri",
    name: "Mandiri Virtual Account",
    icon: "🏦",
    group: "Transfer",
  },
  { id: "bni", name: "BNI Virtual Account", icon: "🏦", group: "Transfer" },
  { id: "bri", name: "BRI Virtual Account", icon: "🏦", group: "Transfer" },
  { id: "gopay", name: "GoPay", icon: "💚", group: "E-Wallet" },
  { id: "ovo", name: "OVO", icon: "💜", group: "E-Wallet" },
  { id: "dana", name: "DANA", icon: "💙", group: "E-Wallet" },
  { id: "shopeepay", name: "ShopeePay", icon: "🟠", group: "E-Wallet" },
  { id: "qris", name: "QRIS", icon: "📱", group: "Lainnya" },
  { id: "cc", name: "Kartu Kredit / Debit", icon: "💳", group: "Lainnya" },
];
const GROUPS = ["Transfer", "E-Wallet", "Lainnya"];

export default function BookingForm() {
  const { tierId } = useParams(); // silver | gold | platinum
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const pkg = PACKAGES.find((p) => p.id === tierId);

  const [step, setStep] = useState(1); // 1=detail, 2=bayar, 3=sukses
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization:
      "Bearer " + (localStorage.getItem("amaranta_token") || token || ""),
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    wedding_date: "",
    location: "",
    konsep: "",
    guest_count: "",
    notes: "",
  });

  const [bookedDates, setBookedDates] = useState([]);

  // Redirect jika paket tidak valid
  useEffect(() => {
    if (!pkg) navigate("/paket", { replace: true });
  }, [pkg, navigate]);

  // Fetch tanggal yang sudah dipesan
  useEffect(() => {
    fetch(
      (import.meta.env.VITE_API_URL || "http://localhost:8000/api") +
        "/bookings/booked-dates",
      {
        headers: { Accept: "application/json" },
      },
    )
      .then((r) => r.json())
      .then((d) => setBookedDates(d.data || []))
      .catch(() => {});
  }, []);

  // Cek apakah tanggal sudah dipesan
  function isDateBooked(date) {
    return date ? bookedDates.includes(date) : false;
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setApiError("");
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.includes("@")) e.email = "Email tidak valid";
    if (!form.phone.match(/^08/)) e.phone = "Format: 08xxxxxxxxxx";
    if (!form.wedding_date) e.wedding_date = "Tanggal wajib diisi";
    else if (isDateBooked(form.wedding_date))
      e.wedding_date =
        "Tanggal ini sudah dipesan oleh customer lain. Pilih tanggal berbeda.";
    if (!form.location.trim()) e.location = "Lokasi wajib diisi";
    if (!form.konsep.trim()) e.konsep = "Konsep wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Step 1 → 2: simpan booking ke DB, lanjut ke pilih metode bayar
  async function handleNext() {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const notes = [
        form.guest_count ? `Tamu: ${form.guest_count} orang` : "",
        form.notes || "",
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch(API + "/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify({
          tier_id: pkg.id, // 'silver' | 'gold' | 'platinum' — lebih stabil dari ID numerik
          pemesan_name: form.name,
          pemesan_email: form.email,
          pemesan_phone: form.phone,
          wedding_date: form.wedding_date,
          location: form.location,
          konsep: form.konsep,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors
          ? Object.values(data.errors).flat()[0]
          : data.message || "Gagal membuat booking.";
        setApiError(msg);
        setLoading(false);
        return;
      }
      setBookingId(data.data?.id);
      setOrderId(data.data?.order_id);
      setStep(2);
    } catch {
      setApiError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 → 3: buat Midtrans Snap token, buka popup bayar
  async function handlePay() {
    if (!method) {
      setApiError("Pilih metode pembayaran.");
      return;
    }
    if (!bookingId) {
      setApiError("Booking belum dibuat. Kembali ke langkah sebelumnya.");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/pay`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || "Gagal memulai pembayaran.");
        setLoading(false);
        return;
      }

      const snapToken = data.snap_token || data.data?.snap_token;
      if (snapReady() && snapToken) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            setLoading(false);
            setStep(3);
          },
          onPending: () => {
            setApiError("Pembayaran pending. Cek email untuk instruksi.");
            setLoading(false);
          },
          onError: () => {
            setApiError("Pembayaran gagal. Coba metode lain.");
            setLoading(false);
          },
          onClose: () => setLoading(false),
        });
      } else {
        // Dev mode — simulasi tanpa Snap.js
        setTimeout(() => {
          setLoading(false);
          setStep(3);
        }, 1000);
      }
    } catch {
      setApiError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  if (!pkg) return null;

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header paket */}
        <div className="mb-6 p-4 bg-white border border-[var(--color-cream-border)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ background: pkg.color }}
            />
            <div>
              <p className="font-[var(--font-display)] text-lg text-[var(--color-dark)]">
                Paket {pkg.tier}
              </p>
              <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)]">
                {pkg.tagline}
              </p>
            </div>
          </div>
          <p className="font-[var(--font-display)] text-xl text-[var(--color-gold)] flex-shrink-0">
            {formatRupiah(pkg.price)}
          </p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {["Detail Acara", "Pembayaran", "Selesai"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    step > i + 1
                      ? "bg-emerald-500 text-white"
                      : step === i + 1
                        ? "bg-[var(--color-gold)] text-[var(--color-dark)]"
                        : "bg-[var(--color-cream-border)] text-[var(--color-slate)]",
                  ].join(" ")}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span
                  className={[
                    "text-xs font-[var(--font-sans)] hidden sm:inline",
                    step >= i + 1
                      ? "text-[var(--color-dark)]"
                      : "text-[var(--color-slate)]",
                  ].join(" ")}
                >
                  {label}
                </span>
                {i < 2 && (
                  <div
                    className={[
                      "h-px w-8",
                      step > i + 1
                        ? "bg-emerald-400"
                        : "bg-[var(--color-cream-border)]",
                    ].join(" ")}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: Detail ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Kontak */}
            <div className="bg-white border border-[var(--color-cream-border)] p-5">
              <h2 className="text-xs uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-4 pb-3 border-b border-[var(--color-cream-border)]">
                Informasi Kontak
              </h2>
              <div className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  error={errors.name}
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  error={errors.email}
                  hint="Konfirmasi & invoice dikirim ke email ini"
                />
                <Input
                  label="No. HP / WhatsApp"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  error={errors.phone}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            {/* Detail acara */}
            <div className="bg-white border border-[var(--color-cream-border)] p-5">
              <h2 className="text-xs uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-4 pb-3 border-b border-[var(--color-cream-border)]">
                Detail Acara
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                    Tanggal Pernikahan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="wedding_date"
                    value={form.wedding_date}
                    onChange={handleChange}
                    min={today}
                    className={fCls(errors.wedding_date)}
                  />
                  {errors.wedding_date && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.wedding_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                    Lokasi Acara <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="contoh: Jakarta Selatan, Gedung Smesco"
                    className={fCls(errors.location)}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                    Konsep / Tema <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="konsep"
                    value={form.konsep}
                    onChange={handleChange}
                    placeholder="Garden Romantic, Rustic, Modern Minimalist..."
                    className={fCls(errors.konsep)}
                  />
                  {errors.konsep && (
                    <p className="text-xs text-red-500 mt-1">{errors.konsep}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                      Perkiraan Tamu
                    </label>
                    <input
                      type="number"
                      name="guest_count"
                      value={form.guest_count}
                      onChange={handleChange}
                      placeholder="150"
                      min="1"
                      className={fCls(false)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--color-dark-muted)] font-[var(--font-sans)] block mb-1.5">
                      Catatan
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Permintaan khusus..."
                      className={fCls(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {apiError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 font-[var(--font-sans)]">
                ⚠️ {apiError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link
                to="/paket"
                className="text-xs text-[var(--color-slate)] hover:text-[var(--color-dark)] font-[var(--font-sans)]"
              >
                ← Ganti Paket
              </Link>
              <Button
                variant="gold"
                size="lg"
                isLoading={loading}
                onClick={handleNext}
              >
                Lanjut ke Pembayaran →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Metode Bayar ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Ringkasan */}
            <div className="bg-[var(--color-gold-pale)] border border-[var(--color-gold)]/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-[var(--font-sans)]">
                  Ringkasan Pemesanan
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)]"
                >
                  ✎ Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-[var(--font-sans)]">
                {[
                  { l: "Paket", v: "Paket " + pkg.tier },
                  { l: "Pemesan", v: form.name },
                  { l: "Tgl Nikah", v: form.wedding_date },
                  { l: "Lokasi", v: form.location },
                  { l: "Konsep", v: form.konsep },
                  { l: "Order", v: orderId },
                ]
                  .filter((x) => x.v)
                  .map(({ l, v }) => (
                    <div key={l}>
                      <span className="text-[var(--color-slate)]">{l}: </span>
                      <span className="font-medium text-[var(--color-dark)]">
                        {v}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-gold)]/20 flex justify-between">
                <span className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
                  Total Pembayaran
                </span>
                <span className="font-[var(--font-display)] text-xl text-[var(--color-gold)]">
                  {formatRupiah(pkg.price)}
                </span>
              </div>
            </div>

            {/* Midtrans badge */}
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-xs font-medium text-blue-800 font-[var(--font-sans)]">
                  Pembayaran aman via Midtrans
                </p>
                <p className="text-xs text-blue-500 font-[var(--font-sans)]">
                  SSL Encrypted · {snapReady() ? "✅ Snap siap" : "⚠️ Mode dev"}
                </p>
              </div>
            </div>

            {apiError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 font-[var(--font-sans)]">
                ⚠️ {apiError}
              </div>
            )}

            {/* Pilih metode */}
            <div className="bg-white border border-[var(--color-cream-border)] p-5 space-y-4">
              {GROUPS.map((group) => (
                <div key={group}>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-2">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.filter((m) => m.group === group).map(
                      (m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setMethod(m.id);
                            setApiError("");
                          }}
                          className={[
                            "flex items-center gap-2 p-3 border text-left transition-all",
                            method === m.id
                              ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]"
                              : "border-[var(--color-cream-border)] hover:border-[var(--color-gold)]/50",
                          ].join(" ")}
                        >
                          <span className="text-base flex-shrink-0">
                            {m.icon}
                          </span>
                          <span className="text-xs text-[var(--color-dark)] font-[var(--font-sans)]">
                            {m.name}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-[var(--color-slate)] hover:text-[var(--color-dark)] font-[var(--font-sans)]"
              >
                ← Kembali
              </button>
              <Button
                variant="gold"
                size="lg"
                isLoading={loading}
                onClick={handlePay}
                disabled={!method}
              >
                Bayar {formatRupiah(pkg.price)}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Sukses ── */}
        {step === 3 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-3">
              Pembayaran Berhasil
            </p>
            <h1 className="font-[var(--font-display)] text-4xl text-[var(--color-dark)] mb-2">
              Pesanan Dikonfirmasi!
            </h1>
            <p className="font-[var(--font-display)] text-xl text-[var(--color-gold)] mb-2 tracking-widest">
              {orderId}
            </p>
            <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)] mb-8 leading-relaxed max-w-sm mx-auto">
              Konfirmasi dikirim ke <strong>{form.email}</strong>.<br />
              Tim AMARANTA menghubungi Anda dalam 1×24 jam.
            </p>

            {/* Detail acara ringkas */}
            <div className="bg-white border border-[var(--color-cream-border)] p-5 mb-8 text-left max-w-sm mx-auto">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] mb-3">
                Alur Selanjutnya
              </p>
              {[
                "① Admin AMARANTA memilih vendor untuk acara Anda",
                "② Anda akan dihubungi untuk tech meeting bersama vendor",
                "③ Persiapan dimulai setelah vendor dikonfirmasi",
                "④ Nikmati hari spesial — kami urus semua detailnya!",
              ].map((s) => (
                <p
                  key={s}
                  className="text-xs text-[var(--color-dark-muted)] font-[var(--font-sans)] mb-1.5"
                >
                  {s}
                </p>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/pelanggan/pemesanan"
                className="px-8 py-3 bg-[var(--color-dark)] text-[var(--color-cream)] text-xs uppercase tracking-widest font-[var(--font-sans)] hover:bg-[var(--color-charcoal)] transition-colors"
              >
                Lihat Pemesanan
              </Link>
              {bookingId && (
                <Link
                  to={"/pelanggan/invoice/" + bookingId}
                  target="_blank"
                  className="flex items-center justify-center gap-2 px-8 py-3 border border-[var(--color-gold)] text-[var(--color-gold)] text-xs uppercase tracking-widest font-[var(--font-sans)] hover:bg-[var(--color-gold-pale)] transition-all"
                >
                  <svg
                    className="w-4 h-4"
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
                  Cetak Invoice
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
