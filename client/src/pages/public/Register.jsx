import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { authService } from "../../services";
import Navbar from "../../components/Navbar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Register() {
  const [step, setStep] = useState(1); // 1=form daftar, 2=input OTP
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [regErr, setRegErr] = useState(""); // error dari API register
  const [otpErr, setOtpErr] = useState(""); // error dari API verify
  const [resent, setResent] = useState(false);
  const { register, verifyOtp, isLoading } = useAuth();

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((p) => ({ ...p, [e.target.name]: "" }));
    setRegErr("");
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.includes("@")) e.email = "Format email tidak valid";
    if (!form.phone.match(/^08\d{8,}/)) e.phone = "Format: 08xxxxxxxxxx";
    if (form.password.length < 8) e.password = "Minimal 8 karakter";
    if (form.password !== form.confirm) e.confirm = "Password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setRegErr("");
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      // Berhasil → tampilkan form OTP
      setStep(2);
    } catch (err) {
      // Tampilkan error dari backend (email sudah terdaftar, dll)
      setRegErr(
        err.userMessage || err.message || "Pendaftaran gagal. Coba lagi.",
      );
    }
  }

  async function handleVerify(ev) {
    ev.preventDefault();
    if (otp.length !== 6) return;
    setOtpErr("");
    try {
      await verifyOtp({ email: form.email, otp });
      // useAuth.verifyOtp akan navigate ke /pelanggan/pemesanan
    } catch (err) {
      setOtpErr(err.userMessage || "Kode OTP salah atau sudah kadaluarsa.");
      setOtp("");
    }
  }

  async function handleResend() {
    try {
      await authService.resendOtp({ email: form.email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {}
  }

  // ── STEP 1: Form Daftar ─────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)]">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-white border border-[var(--color-cream-border)] p-8">
            <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] mb-2">
              Buat Akun
            </h1>
            <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)] mb-6">
              Daftar untuk memesan paket pernikahan AMARANTA.
            </p>

            {regErr && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 font-[var(--font-sans)]">
                ⚠️ {regErr}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
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
                hint="Kode OTP akan dikirim ke email ini"
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
              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                error={errors.password}
                hint="Minimal 8 karakter"
              />
              <Input
                label="Konfirmasi Password"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                required
                error={errors.confirm}
              />

              <Button
                type="submit"
                variant="gold"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Daftar & Kirim OTP
              </Button>
            </form>

            <p className="mt-5 text-sm text-center text-[var(--color-dark-muted)] font-[var(--font-sans)]">
              Sudah punya akun?{" "}
              <Link
                to="/masuk"
                className="text-[var(--color-gold)] hover:underline font-medium"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Input OTP ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm bg-white border border-[var(--color-cream-border)] p-8">
          {/* Ikon email */}
          <div className="w-16 h-16 bg-[var(--color-gold-pale)] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-[var(--color-gold)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="font-[var(--font-display)] text-2xl text-[var(--color-dark)] text-center mb-2">
            Verifikasi Email
          </h2>
          <p className="text-sm text-[var(--color-slate)] font-[var(--font-sans)] text-center mb-1 leading-relaxed">
            Kode OTP 6 digit telah dikirim ke
          </p>
          <p className="text-sm font-medium text-[var(--color-dark)] font-[var(--font-sans)] text-center mb-6">
            {form.email}
          </p>

          {/* Error OTP */}
          {otpErr && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 font-[var(--font-sans)] text-center">
              ⚠️ {otpErr}
            </div>
          )}

          {/* Resent success */}
          {resent && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-sm text-green-600 font-[var(--font-sans)] text-center">
              ✓ Kode baru telah dikirim
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Input OTP besar di tengah */}
            <div className="text-center">
              <label className="text-xs uppercase tracking-widest text-[var(--color-slate)] font-[var(--font-sans)] block mb-3">
                Masukkan Kode OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                autoFocus
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpErr("");
                }}
                placeholder="000000"
                className="w-full text-center text-4xl tracking-[0.6em] border-b-2 border-[var(--color-cream-border)] focus:border-[var(--color-gold)] bg-transparent outline-none py-3 font-[var(--font-display)] text-[var(--color-dark)] transition-colors"
              />
              <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mt-2">
                Berlaku selama 5 menit
              </p>
            </div>

            <Button
              type="submit"
              variant="gold"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={otp.length !== 6}
            >
              Verifikasi & Masuk
            </Button>
          </form>

          {/* Kirim ulang + ganti email */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs font-[var(--font-sans)]">
            <button
              onClick={handleResend}
              className="text-[var(--color-gold)] hover:underline"
            >
              Kirim ulang OTP
            </button>
            <span className="text-[var(--color-cream-border)]">·</span>
            <button
              onClick={() => {
                setStep(1);
                setOtp("");
                setOtpErr("");
              }}
              className="text-[var(--color-slate)] hover:text-[var(--color-dark)] transition-colors"
            >
              Ganti email
            </button>
          </div>

          {/* Hint dev mode */}
          {import.meta.env.DEV && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 font-[var(--font-sans)] text-center">
                Mode dev: cek kode di Mailtrap atau
                <br />
                <code className="bg-amber-100 px-1">
                  server/storage/logs/laravel.log
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
