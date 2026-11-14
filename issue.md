# Plan: Inisialisasi Project ElysiaJS + Drizzle ORM + MySQL dengan Bun

## 📌 Ringkasan Proyek
Inisialisasi dan setup skeleton backend project modern di direktori ini menggunakan runtime **Bun**, framework web **ElysiaJS**, ORM **Drizzle**, dan database **MySQL**.

Dokumen ini disusun sebagai panduan kerja tingkat tinggi (*high-level implementation plan*) untuk programmer atau model AI pelaksana.

---

## 🛠️ Tech Stack & Dependencies
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Database Driver**: `mysql2`
- **Database**: MySQL

---

## 📂 Rekomendasi Struktur Direktori
```text
.
├── src/
│   ├── db/
│   │   ├── index.ts          # Koneksi & instance database Drizzle
│   │   └── schema.ts         # Definisi tabel / schema Drizzle
│   ├── routes/               # Definisi endpoint API
│   │   └── users.ts
│   └── index.ts              # Entry point aplikasi Elysia
├── drizzle/                  # Direktori hasil generate migrasi (dikelola drizzle-kit)
├── .env.example              # Template variabel lingkungan
├── .env                      # Konfigurasi lokal (git ignored)
├── .gitignore
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📋 Tahapan Implementasi (Action Items)

### Fase 1: Inisialisasi Project & Dependensi
- [x] Inisialisasi workspace Bun (`bun init -y` di root direktori).
- [x] Pastikan `.gitignore` mencakup `node_modules`, `.env`, build artifacts, dan cache Bun.
- [x] Install dependensi utama:
  - Framework: `elysia`
  - ORM & Driver: `drizzle-orm`, `mysql2`
- [x] Install dependensi development:
  - `drizzle-kit` (CLI migrasi & schema management)
  - Type definitions yang diperlukan (misal: `@types/bun`).

### Fase 2: Konfigurasi Environment & Drizzle
- [x] Siapkan template environment (`.env.example` dan `.env`) yang memuat koneksi MySQL:
  - `DATABASE_URL` (format: `mysql://user:password@host:port/dbname`) atau variabel terpisah (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
- [x] Buat file konfigurasi Drizzle (`drizzle.config.ts`):
  - Tentukan dialect: `mysql`
  - Tentukan path schema: `./src/db/schema.ts`
  - Tentukan path output migrasi: `./drizzle`
  - Hubungkan kredensial dari environment variable.

### Fase 3: Setup Koneksi Database & Schema Drizzle
- [x] Buat modul koneksi database (`src/db/index.ts`):
  - Inisialisasi pool koneksi MySQL menggunakan driver `mysql2`.
  - Export instance Drizzle client yang dibungkus dengan koneksi tersebut.
- [x] Definisikan contoh schema awal (`src/db/schema.ts`):
  - Buat tabel contoh (misal: `users` atau `items`) untuk membuktikan integrasi Drizzle dengan MySQL berjalan baik.
- [x] Tambahkan script package.json untuk migrasi:
  - Script untuk generate migration (`drizzle-kit generate`).
  - Script untuk push schema langsung / migrate (`drizzle-kit push` atau `drizzle-kit migrate`).

### Fase 4: Setup Server ElysiaJS & Routing
- [x] Buat entry point server Elysia (`src/index.ts`):
  - Inisialisasi app Elysia.
  - Setup port server (default misal: 3000 atau dari `PORT` env).
- [x] Buat endpoint dasar:
  - Endpoint health-check (misal: `GET /` atau `GET /health`).
  - Endpoint uji coba database (misal: `GET /api/test` atau CRUD sederhana) yang memanggil instance Drizzle untuk membaca data dari tabel contoh.
- [x] Tambahkan script runner di `package.json`:
  - `bun run --watch src/index.ts` untuk development.

### Fase 5: Verifikasi & Dokumentasi
- [x] Uji server: Jalankan `bun run dev` dan pastikan server menyala tanpa error.
- [x] Uji endpoint health-check via HTTP client / curl.
- [x] Uji Drizzle: Pastikan schema dapat di-push atau di-generate migrasinya.
- [x] Buat file `README.md` singkat yang menjelaskan cara instalasi, konfigurasi `.env`, menjalankan migrasi, dan menyalakan server.

---

## 🎯 Kriteria Selesai (Definition of Done)
1. Project dapat diinstal dependensinya dengan perintah tunggal `bun install`.
2. Terdapat file `.env.example` dan konfigurasi `drizzle.config.ts` yang valid.
3. Server ElysiaJS dapat berjalan dengan `bun run dev` dan merespon request.
4. Instance Drizzle ORM terhubung ke MySQL dan siap digunakan untuk query di dalam handler Elysia.
