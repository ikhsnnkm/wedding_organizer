// ============================================================
// src/data/packages.js
// KONSEP: AMARANTA adalah 1 wedding organizer dengan 3 paket.
// Customer memilih paket (Silver/Gold/Platinum), bukan memilih vendor.
// Vendor panel = manajemen konten AMARANTA sendiri.
// ============================================================

// ── Informasi AMARANTA (si vendor tunggal) ─────────────────────
export const AMARANTA_INFO = {
  id: 1,
  name: "AMARANTA Wedding Organizer",
  slug: "amaranta",
  tagline: "Kami wujudkan hari paling berharga dalam hidupmu",
  description:
    "AMARANTA adalah wedding organizer premium yang telah membantu lebih dari 500 pasangan sejak 2015. Kami menggabungkan sentuhan artistik, pelayanan prima, dan koordinasi tanpa cela untuk menghadirkan pernikahan impian Anda.",
  location: "Jakarta & Seluruh Indonesia",
  since: 2015,
  rating: 4.9,
  reviewCount: 500,
  phone: "+62 811-0000-1234",
  email: "halo@amaranta.id",
  instagram: "@amaranta.id",
  cover:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1400&q=90",
  logo: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80",
    "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80",
    "https://images.unsplash.com/photo-1487530811015-780780169993?w=800&q=80",
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80",
  ],
  team: [
    {
      name: "Anisa Dewi",
      role: "Founder & Lead Coordinator",
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    },
    {
      name: "Reza Pratama",
      role: "Head of Decoration",
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    },
    {
      name: "Maya Florencia",
      role: "Florist & Stylist",
      img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
    },
    {
      name: "Julian Ahmad",
      role: "Head Photographer",
      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    },
  ],
  stats: [
    { value: "500+", label: "Pasangan Bahagia" },
    { value: "9", label: "Tahun Pengalaman" },
    { value: "4.9", label: "Rating Rata-rata" },
    { value: "100%", label: "Kepuasan Klien" },
  ],
};

// ── 3 Paket AMARANTA ──────────────────────────────────────────
export const PACKAGES = [
  {
    id: "silver",
    dbId: 1, // ID di tabel packages (dari seeder)
    tier: "Silver",
    tagline: "Pernikahan berkesan, budget terjangkau",
    price: 25000000,
    color: "#A8B8C8",
    popular: false,
    guests: "50–100 tamu",
    maxGuests: 100,
    duration: "6 jam",
    // Gambar bisa diedit dari vendor panel
    img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    includes: [
      { label: "Gedung / Venue", detail: "Sewa aula hingga 100 pax, 6 jam" },
      {
        label: "Dekorasi Pelaminan",
        detail: "Pelaminan minimalis elegan, bunga segar",
      },
      {
        label: "Katering 100 Porsi",
        detail: "3 lauk, 2 sayur, nasi, minuman, dessert",
      },
      {
        label: "Dokumentasi Foto",
        detail: "1 fotografer, 200 foto edit, softcopy",
      },
      { label: "MC Profesional", detail: "1 MC briefed, handle rundown acara" },
      {
        label: "Undangan Digital + Fisik",
        detail: "Desain + cetak 50 pcs undangan fisik",
      },
      {
        label: "Rias Pengantin",
        detail: "Makeup & hairdo + 2 orang bridesmaid",
      },
      {
        label: "Koordinator Hari H",
        detail: "1 wedding coordinator on-site full day",
      },
    ],
    notIncluded: [
      "Videografi",
      "Live Musik",
      "Photo Booth",
      "Pre-Wedding",
      "Honeymoon",
    ],
  },
  {
    id: "gold",
    dbId: 2,
    tier: "Gold",
    tagline: "Paling populer — lengkap & berkesan",
    price: 45000000,
    color: "#C9A96E",
    popular: true,
    guests: "100–200 tamu",
    maxGuests: 200,
    duration: "8 jam",
    img: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    includes: [
      {
        label: "Gedung / Venue Premium",
        detail: "Ballroom hingga 200 pax, 8 jam",
      },
      {
        label: "Dekorasi Full Tema",
        detail: "Full tema pilihan, bunga segar, backdrop",
      },
      {
        label: "Katering 200 Porsi",
        detail: "5 lauk, 3 sayur, nasi, minuman, 2 dessert",
      },
      {
        label: "Foto + Video",
        detail: "2 fotografer + 1 videografer, highlight 5 mnt",
      },
      { label: "MC Profesional", detail: "1 MC, briefing & rundown detail" },
      {
        label: "Undangan Premium",
        detail: "Desain premium + 100 pcs hard cover",
      },
      {
        label: "Rias Pengantin Premium",
        detail: "Makeup airbrush + 4 orang bridesmaid",
      },
      {
        label: "Live Musik Akustik",
        detail: "Duo akustik 3 jam, setlist request",
      },
      {
        label: "Photo Booth",
        detail: "Setup + props + cetak instan 100 lembar",
      },
      {
        label: "Koordinator + Tim",
        detail: "1 coordinator + 3 asisten on-site",
      },
    ],
    notIncluded: ["Pre-Wedding Shoot", "Honeymoon Package"],
  },
  {
    id: "platinum",
    dbId: 3,
    tier: "Platinum",
    tagline: "Pengalaman pernikahan mewah tak terlupakan",
    price: 85000000,
    color: "#B8A9C9",
    popular: false,
    guests: "200–500 tamu",
    maxGuests: 500,
    duration: "10 jam",
    img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    includes: [
      {
        label: "Gedung Eksklusif",
        detail: "Venue / hotel bintang 5, 500 pax, 10 jam",
      },
      {
        label: "Dekorasi Mewah Full Custom",
        detail: "Desainer khusus, bunga impor, chandelier",
      },
      {
        label: "Katering Fine Dining 300",
        detail: "7 menu utama + live cooking station",
      },
      {
        label: "Dokumentasi Cinema Style",
        detail: "3 fotografer + 2 videografer + sinematik 10 mnt",
      },
      {
        label: "MC Bilingual",
        detail: "MC Indonesia/Inggris, terlatih & berpengalaman",
      },
      {
        label: "Undangan Premium Box",
        detail: "Undangan kotak eksklusif + suvenir 200 pcs",
      },
      {
        label: "Rias + Fashion Stylist",
        detail: "MUA profesional + fashion stylist + fitting 2x",
      },
      {
        label: "Live Band Full",
        detail: "Band 5 orang + penyanyi solo, 4 jam",
      },
      {
        label: "Photo & Video Booth",
        detail: "Booth animasi + cetak 200 lembar",
      },
      {
        label: "Pre-Wedding Shoot",
        detail: "1 hari, outdoor + studio, hasil edit lengkap",
      },
      {
        label: "Honeymoon Package",
        detail: "3 hari 2 malam Bali / Lombok all-inclusive",
      },
      {
        label: "Tim Koordinator Lengkap",
        detail: "1 lead + 5 asisten + driver on-call hari H",
      },
    ],
    notIncluded: [],
  },
];

// ── GALERI UMUM ───────────────────────────────────────────────
export const GALLERY_IMAGES = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    category: "Venue",
    caption: "Ballroom Elegan",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
    category: "Dekorasi",
    caption: "Dekorasi Bunga Segar",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    category: "Venue",
    caption: "Pernikahan Outdoor",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80",
    category: "Foto",
    caption: "Momen Bahagia",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1487530811015-780780169993?w=800&q=80",
    category: "Dekorasi",
    caption: "Rangkaian Bunga",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
    category: "Resepsi",
    caption: "Resepsi Romantis",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80",
    category: "Foto",
    caption: "Ciuman Pengantin",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80",
    category: "Venue",
    caption: "Taman Pernikahan",
  },
];

// ── Alias untuk kompatibilitas kode lama ─────────────────────
// Beberapa komponen masih pakai MAIN_PACKAGES / VENDORS
export const MAIN_PACKAGES = PACKAGES;
export const VENDORS = [
  {
    ...AMARANTA_INFO,
    packages: PACKAGES.map((p) => ({ tierId: p.id, price: p.price })),
  },
];

// ── Helper ────────────────────────────────────────────────────
export const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export const getPackageById = (id) => PACKAGES.find((p) => p.id === id) || null;
