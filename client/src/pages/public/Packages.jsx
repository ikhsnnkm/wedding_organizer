// ============================================================
// src/pages/public/Packages.jsx
// Halaman pemilihan paket AMARANTA — Silver / Gold / Platinum
// Customer langsung pilih paket tanpa perlu memilih vendor
// ============================================================
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { PACKAGES, AMARANTA_INFO, formatRupiah } from "../../data/packages";
import useAuthStore from "../../store/authStore";

function Packages() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!(token && user);

  const [activePkg, setActivePkg] = useState(null);

  function handlePesan(pkg) {
    if (!isAuthenticated) {
      sessionStorage.setItem(
        "pendingPackage",
        JSON.stringify({ id: pkg.id, dbId: pkg.dbId }),
      );
      navigate("/masuk");
      return;
    }
    navigate("/pesan/" + pkg.id);
  }

  const allFeatures = [
    "Gedung / Venue",
    "Dekorasi",
    "Katering",
    "Dokumentasi Foto",
    "Videografi / Video",
    "MC Profesional",
    "Undangan",
    "Rias Pengantin",
    "Live Musik",
    "Photo Booth",
    "Pre-Wedding Shoot",
    "Honeymoon Package",
    "Tim Koordinator",
  ];

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-dark)] pt-16">
        <div className="absolute inset-0 opacity-20">
          <img
            src={AMARANTA_INFO.cover}
            alt="hero"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-gold)] font-[var(--font-sans)] mb-4">
            Pilih Paket Pernikahan Anda
          </p>
          <h1 className="font-[var(--font-display)] text-5xl md:text-6xl text-[var(--color-cream)] mb-4">
            Tiga Pilihan, <em>Satu Kenangan</em>
          </h1>
          <p className="text-base text-white/60 font-[var(--font-sans)] max-w-xl mx-auto">
            Setiap paket dikerjakan langsung oleh tim AMARANTA. Pilih yang
            sesuai kebutuhan Anda.
          </p>
        </div>
      </section>

      {/* 3 Kartu Paket */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PACKAGES.map((pkg) => {
            const isExpanded = activePkg === pkg.id;

            return (
              <div
                key={pkg.id}
                className={[
                  "flex flex-col bg-white border-2 transition-all duration-300 relative",
                  pkg.popular
                    ? "border-[var(--color-gold)] shadow-[var(--shadow-gold)]"
                    : "border-[var(--color-cream-border)] hover:border-[var(--color-gold)]/50 hover:shadow-[var(--shadow-luxury)]",
                ].join(" ")}
              >
                {/* Badge populer — lebih menonjol */}
                {pkg.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="px-5 py-1.5 bg-[var(--color-gold)] text-[var(--color-dark)] text-[11px] uppercase tracking-[0.2em] font-[var(--font-sans)] font-bold shadow-[var(--shadow-gold)]">
                      ★ Paling Populer ★
                    </span>
                  </div>
                )}

                {/* Foto paket */}
                <div className="relative overflow-hidden aspect-[3/2]">
                  <img
                    src={pkg.img}
                    alt={"Paket " + pkg.tier}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark)]/60 to-transparent" />
                  {/* Lingkaran warna tier */}
                  <div
                    className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-white/60"
                    style={{ backgroundColor: pkg.color }}
                  />
                  <div className="absolute bottom-4 left-4">
                    <h2 className="font-[var(--font-display)] text-2xl text-white">
                      Paket {pkg.tier}
                    </h2>
                    <p className="text-xs text-white/70 font-[var(--font-sans)]">
                      {pkg.guests} · {pkg.duration}
                    </p>
                  </div>
                </div>

                {/* Konten */}
                <div className="flex-1 flex flex-col p-6">
                  <p className="text-xs text-[var(--color-dark-subtle)] font-[var(--font-sans)] italic mb-4 leading-relaxed">
                    "{pkg.tagline}"
                  </p>

                  {/* Harga */}
                  <div className="mb-5">
                    <p className="font-[var(--font-display)] text-4xl text-[var(--color-dark)]">
                      {formatRupiah(pkg.price)}
                    </p>
                    <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mt-0.5">
                      DP 30% = {formatRupiah(Math.round(pkg.price * 0.3))}
                    </p>
                  </div>

                  {/* 4 item pertama */}
                  <ul className="space-y-2 mb-4 flex-1">
                    {pkg.includes.slice(0, 4).map((item) => (
                      <li key={item.label} className="flex items-start gap-2.5">
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          style={{ color: pkg.color }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
                          {item.label}
                        </span>
                      </li>
                    ))}

                    {/* Expand/collapse sisa item */}
                    {isExpanded &&
                      pkg.includes.slice(4).map((item) => (
                        <li
                          key={item.label}
                          className="flex items-start gap-2.5 animate-fade-in"
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style={{ color: pkg.color }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
                            {item.label}
                          </span>
                        </li>
                      ))}
                  </ul>

                  {/* Toggle lihat semua */}
                  {pkg.includes.length > 4 && (
                    <button
                      onClick={() => setActivePkg(isExpanded ? null : pkg.id)}
                      className="text-xs text-[var(--color-gold)] hover:underline font-[var(--font-sans)] mb-4 text-left flex items-center gap-1"
                    >
                      {isExpanded
                        ? "Sembunyikan"
                        : "+ " + (pkg.includes.length - 4) + " layanan lainnya"}
                      <svg
                        className={[
                          "w-3 h-3 transition-transform",
                          isExpanded ? "rotate-180" : "",
                        ].join(" ")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Tidak termasuk */}
                  {pkg.notIncluded.length > 0 && !isExpanded && (
                    <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] mb-4">
                      Tidak termasuk: {pkg.notIncluded.slice(0, 2).join(", ")}
                      {pkg.notIncluded.length > 2 &&
                        ", +" + (pkg.notIncluded.length - 2) + " lainnya"}
                    </p>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => handlePesan(pkg)}
                    className={[
                      "w-full py-3.5 text-sm uppercase tracking-widest font-[var(--font-sans)] font-medium transition-all duration-300",
                      pkg.popular
                        ? "bg-[var(--color-gold)] text-[var(--color-dark)] hover:bg-[var(--color-gold-light)]"
                        : "bg-[var(--color-dark)] text-[var(--color-cream)] hover:bg-[var(--color-charcoal)]",
                    ].join(" ")}
                  >
                    {"Pesan Paket " + pkg.tier}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabel perbandingan */}
        <div className="mt-20">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-2">
            Perbandingan Lengkap
          </p>
          <h2 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] text-center mb-10">
            Apa yang Anda Dapatkan
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="border-b-2 border-[var(--color-cream-border)]">
                  <th className="text-left px-5 py-4 text-xs text-[var(--color-slate)] font-[var(--font-sans)] uppercase tracking-widest w-2/5">
                    Layanan
                  </th>
                  {PACKAGES.map((pkg) => (
                    <th key={pkg.id} className="px-4 py-4 text-center">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1.5"
                        style={{ backgroundColor: pkg.color }}
                      />
                      <span className="text-xs font-medium text-[var(--color-dark)] font-[var(--font-sans)] uppercase tracking-widest">
                        {pkg.tier}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feat, i) => (
                  <tr
                    key={feat}
                    className={[
                      "border-b border-[var(--color-cream-border)] transition-colors",
                      i % 2 === 0 ? "bg-white" : "bg-[var(--color-cream)]/50",
                    ].join(" ")}
                  >
                    <td className="px-5 py-3.5 text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)]">
                      {feat}
                    </td>
                    {PACKAGES.map((pkg) => {
                      const included = pkg.includes.some(
                        (item) =>
                          item.label
                            .toLowerCase()
                            .includes(
                              feat.split("/")[0].trim().toLowerCase(),
                            ) ||
                          feat
                            .toLowerCase()
                            .includes(item.label.toLowerCase().split(" ")[0]),
                      );
                      return (
                        <td key={pkg.id} className="px-4 py-3.5 text-center">
                          {included ? (
                            <svg
                              className="w-5 h-5 mx-auto"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              style={{ color: pkg.color }}
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 mx-auto text-[var(--color-cream-border)]"
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
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Harga summary */}
                <tr className="bg-[var(--color-dark)] border-0">
                  <td className="px-5 py-4 text-sm font-medium text-[var(--color-cream)] font-[var(--font-sans)]">
                    Total Harga
                  </td>
                  {PACKAGES.map((pkg) => (
                    <td key={pkg.id} className="px-4 py-4 text-center">
                      <span
                        className="font-[var(--font-display)] text-lg"
                        style={{ color: pkg.color }}
                      >
                        {formatRupiah(pkg.price)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-2">
            FAQ
          </p>
          <h2 className="font-[var(--font-display)] text-3xl text-[var(--color-dark)] text-center mb-8">
            Pertanyaan Umum
          </h2>
          {[
            {
              q: "Berapa DP yang harus dibayar?",
              a: "Down payment sebesar 30% dari total paket. Sisa 70% dilunasi setelah acara selesai.",
            },
            {
              q: "Bisakah paket dikustomisasi?",
              a: "Tentu. Hubungi tim kami untuk diskusi paket kustom di luar ketiga pilihan ini.",
            },
            {
              q: "Apakah harga sudah termasuk pajak?",
              a: "Ya, semua harga sudah termasuk PPN 11% dan tidak ada biaya tersembunyi.",
            },
            {
              q: "Bagaimana proses pembatalan?",
              a: "Pembatalan H-30 dikembalikan 50% DP. H-7 tidak ada pengembalian.",
            },
            {
              q: "Melayani pernikahan di luar Jakarta?",
              a: "Ya, kami melayani seluruh Indonesia dengan biaya perjalanan tambahan sesuai lokasi.",
            },
          ].map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center py-14 bg-[var(--color-dark)] px-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-3">
            Siap Mulai?
          </p>
          <h2 className="font-[var(--font-display)] text-3xl text-[var(--color-cream)] mb-4">
            Wujudkan pernikahan impian Anda
          </h2>
          <p className="text-sm text-white/60 font-[var(--font-sans)] mb-8">
            Tim AMARANTA siap membantu dari konsultasi hingga hari H.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/paket"
              className="px-8 py-3.5 bg-[var(--color-gold)] text-[var(--color-dark)] text-xs uppercase tracking-widest font-[var(--font-sans)] font-medium hover:bg-[var(--color-gold-light)] transition-colors"
            >
              Lihat Keranjang
            </Link>
            <Link
              to="/tentang"
              className="px-8 py-3.5 border border-white/20 text-white/80 text-xs uppercase tracking-widest font-[var(--font-sans)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all"
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Komponen FAQ accordion
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-cream-border)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-[var(--color-dark)] font-[var(--font-sans)]">
          {q}
        </span>
        <svg
          className={[
            "w-4 h-4 flex-shrink-0 text-[var(--color-gold)] transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <p className="pb-4 text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)] leading-relaxed animate-fade-in">
          {a}
        </p>
      )}
    </div>
  );
}

export default Packages;
