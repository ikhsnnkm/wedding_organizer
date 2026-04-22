// ============================================================
// src/pages/public/About.jsx — Tentang AMARANTA Wedding Organizer
// ============================================================
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

const TEAM = [
  {
    name: "Anisa Dewi Pratiwi",
    role: "Founder & CEO",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    bio: "10 tahun pengalaman di industri pernikahan Indonesia.",
  },
  {
    name: "Reza Mahendra",
    role: "Head of Operations",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    bio: "Memastikan setiap detail berjalan sempurna di hari H.",
  },
  {
    name: "Sari Wahyuni",
    role: "Creative Director",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    bio: "Seniman dekorasi dengan estetika kontemporer tropis.",
  },
  {
    name: "Budi Santoso",
    role: "Vendor Relations",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    bio: "Menjaga kualitas dan kepercayaan semua mitra vendor.",
  },
];

const About = () => (
  <div className="min-h-screen bg-[var(--color-cream)]">
    <Navbar />

    {/* Hero */}
    <section className="relative py-24 lg:py-36 overflow-hidden bg-[var(--color-dark)]">
      <img
        src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85"
        alt="About"
        className="absolute inset-0 w-full h-full object-cover opacity-15"
      />
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-4">
          Tentang Kami
        </p>
        <h1 className="font-[var(--font-display)] text-5xl lg:text-6xl text-[var(--color-cream)] leading-tight mb-6">
          Kami Ada untuk Membuat
          <br />
          <em className="text-gold-shimmer">Hari Anda Sempurna</em>
        </h1>
        <p className="text-base text-white/60 font-[var(--font-sans)] max-w-xl mx-auto leading-relaxed">
          AMARANTA adalah wedding organizer profesional yang didirikan pada 2015
          dengan misi menghadirkan pengalaman pernikahan terbaik — personal,
          berkesan, dan tanpa hambatan.
        </p>
      </div>
    </section>

    {/* Cerita kami */}
    <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-4">
            Kisah Kami
          </p>
          <h2 className="font-[var(--font-display)] text-4xl text-[var(--color-dark)] mb-6">
            Dari Satu Pernikahan, Tumbuh Menjadi Keluarga Besar
          </h2>
          <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)] leading-relaxed mb-4">
            AMARANTA lahir dari pengalaman pribadi pendiri kami, Anisa Dewi,
            yang merasakan betapa rumitnya merencanakan pernikahan impian tanpa
            bantuan profesional. Pada 2015, ia memutuskan untuk hadir sebagai
            solusi — menggabungkan keahlian koordinasi, jaringan vendor
            terpercaya, dan sentuhan personal yang hangat.
          </p>
          <p className="text-sm text-[var(--color-dark-muted)] font-[var(--font-sans)] leading-relaxed mb-6">
            Kini, delapan tahun kemudian, AMARANTA telah menangani lebih dari
            500 pernikahan di seluruh Indonesia — dari pesta kecil intim hingga
            resepsi besar bintang lima. Setiap pernikahan tetap mendapat
            perhatian yang sama: penuh cinta dan dedikasi.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              ["500+", "Pernikahan"],
              ["8", "Tahun"],
              ["50+", "Vendor"],
              ["4.9", "Rating"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-[var(--font-display)] text-3xl text-[var(--color-gold)]">
                  {v}
                </p>
                <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] uppercase tracking-widest">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <img
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80"
            alt="t1"
            className="aspect-[3/4] object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=80"
            alt="t2"
            className="aspect-[3/4] object-cover mt-8"
          />
        </div>
      </div>
    </section>

    <div className="gold-rule" />

    {/* Nilai-nilai */}
    <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-3">
          Yang Kami Pegang
        </p>
        <h2 className="font-[var(--font-display)] text-4xl text-[var(--color-dark)]">
          Nilai-Nilai Kami
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: "💛",
            title: "Personal",
            desc: "Setiap pernikahan adalah cerita unik. Kami mendengarkan, memahami, dan mewujudkan visi Anda.",
          },
          {
            icon: "🎯",
            title: "Profesional",
            desc: "Tim berpengalaman, proses terstruktur, dan koordinasi tanpa celah dari awal hingga selesai.",
          },
          {
            icon: "🤝",
            title: "Terpercaya",
            desc: "Lebih dari 500 pasangan mempercayai kami. Kepercayaan Anda adalah prioritas utama kami.",
          },
          {
            icon: "✨",
            title: "Berkesan",
            desc: "Kami tidak sekadar mengorganisir — kami menciptakan momen yang akan dikenang seumur hidup.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-white border border-[var(--color-cream-border)] p-7 text-center hover:shadow-[var(--shadow-card)] transition-shadow"
          >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="font-[var(--font-display)] text-xl text-[var(--color-dark)] mb-3">
              {title}
            </h3>
            <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] leading-relaxed">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>

    {/* Tim */}
    <section className="py-20 bg-[var(--color-parchment)]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)] font-[var(--font-sans)] mb-3">
            Orang-Orang di Balik Layar
          </p>
          <h2 className="font-[var(--font-display)] text-4xl text-[var(--color-dark)]">
            Tim Kami
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((m) => (
            <div
              key={m.name}
              className="text-center bg-white border border-[var(--color-cream-border)] overflow-hidden group"
            >
              <div className="overflow-hidden aspect-square">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-[var(--font-display)] text-lg text-[var(--color-dark)] mb-1">
                  {m.name}
                </h3>
                <p className="text-xs text-[var(--color-gold)] font-[var(--font-sans)] uppercase tracking-widest mb-3">
                  {m.role}
                </p>
                <p className="text-xs text-[var(--color-slate)] font-[var(--font-sans)] leading-relaxed">
                  {m.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-6 text-center bg-[var(--color-dark)]">
      <div className="max-w-xl mx-auto">
        <h2 className="font-[var(--font-display)] text-4xl text-[var(--color-cream)] mb-4">
          Siap Mulai Perjalanan Anda?
        </h2>
        <p className="text-sm text-white/60 font-[var(--font-sans)] mb-10">
          Konsultasikan impian pernikahan Anda bersama tim AMARANTA — gratis,
          tanpa komitmen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/paket"
            className="px-8 py-4 bg-[var(--color-gold)] text-[var(--color-dark)] text-xs uppercase tracking-widest font-[var(--font-sans)] font-medium hover:bg-[var(--color-gold-light)] transition-colors"
          >
            Pilih Paket
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
