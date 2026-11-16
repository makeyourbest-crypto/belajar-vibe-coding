# Plan: Implementasi Automated Unit Test Menggunakan Bun Test

## 📌 Ringkasan Tugas
Buat automated test suite komprehensif untuk seluruh endpoint API yang tersedia pada aplikasi. Seluruh test disimpan di dalam direktori `test/` dan dijalankan menggunakan test runner bawaan Bun (`bun test`).

Dokumen ini disusun sebagai panduan skenario pengujian tingkat tinggi (*high-level test specification*) untuk programmer atau model AI pelaksana.

---

## 🛠️ Environment & Tools
- **Test Runner**: `bun test` (bawaan runtime Bun: `describe`, `test` / `it`, `expect`, `beforeEach`, `afterAll`).
- **Target Handler**: Instance aplikasi Elysia (`app.handle(new Request(...))`).
- **Database**: Database uji MySQL lokal.

---

## 📂 Struktur Direktori Test yang Direkomendasikan
```text
test/
├── helpers/
│   └── reset-db.ts         # Utility fungsi untuk membersihkan tabel database
├── index.test.ts           # Test endpoint root (GET /) & health check (GET /health)
└── users.test.ts           # Test endpoint registrasi, login, get current user, & logout
```

---

## 🧹 Strategi Kebersihan Data (Data Clean-up)
Agar setiap test case bersifat independen dan hasilnya konsisten:
- Gunakan lifecycle hook `beforeEach` (atau `afterEach`) dari `bun:test` di setiap file test.
- Bersihkan data database sebelum setiap skenario dijalankan (hapus data tabel `sessions` terlebih dahulu karena memiliki foreign key, lalu hapus tabel `users`).
- Tutup koneksi database pool pada hook `afterAll` jika diperlukan agar proses test dapat keluar (*exit*) dengan bersih.

---

## 📋 Daftar Skenario Pengujian per API

### 1. Root & Health Check (`GET /` dan `GET /health`)
- [x] **Skenario 1.1: Root status**
  - Mengirim `GET /`
  - Ekspektasi: HTTP 200, response body memuat `status: "ok"` dan pesan selamat datang.
- [x] **Skenario 1.2: Health check**
  - Mengirim `GET /health`
  - Ekspektasi: HTTP 200, response body `{ "status": "healthy" }`.

---

### 2. Registrasi User (`POST /api/users`)
- [x] **Skenario 2.1: Registrasi sukses (Happy Path)**
  - Mengirim body dengan `name`, `email`, dan `password` valid.
  - Ekspektasi: HTTP 200, response body `{ "data": "OK" }`.
  - Verifikasi DB: Data user tersimpan di tabel `users` dan password berstatus terenkripsi (hash bcrypt).
- [x] **Skenario 2.2: Email duplikat**
  - Melakukan registrasi dengan email yang sudah ada di database.
  - Ekspektasi: HTTP 400, response body `{ "error": "Email sudah terdaftar" }`.
- [x] **Skenario 2.3: Validasi input kosong (Empty fields)**
  - Mengirim body dengan string kosong pada `name`, `email`, atau `password`.
  - Ekspektasi: HTTP 422 (Unprocessable Content).
- [x] **Skenario 2.4: Validasi field hilang (Missing fields)**
  - Mengirim body tanpa salah satu field wajib (misal tanpa password atau tanpa email).
  - Ekspektasi: HTTP 422.
- [x] **Skenario 2.5: Validasi batas panjang maksimum (> 255 karakter)**
  - Mengirim request dengan `name` melebihi 255 karakter (misal 300 karakter).
  - Ekspektasi: HTTP 422 ditolak langsung sebelum query database.

---

### 3. Login User (`POST /api/users/login`)
- [x] **Skenario 3.1: Login sukses (Happy Path)**
  - Terlebih dahulu mendaftarkan user valid, lalu login dengan email dan password yang sesuai.
  - Ekspektasi: HTTP 200, response memuat string token `{ "data": "<token-uuid>" }`.
  - Verifikasi DB: Record baru tersimpan di tabel `sessions` dengan `userId` yang sesuai.
- [x] **Skenario 3.2: Password salah**
  - Mengirim request login dengan email terdaftar tetapi password salah.
  - Ekspektasi: HTTP 400, response body `{ "error": "Email atau password salah" }`.
- [x] **Skenario 3.3: Email tidak terdaftar**
  - Mengirim request login dengan email yang tidak ada di database.
  - Ekspektasi: HTTP 400, response body `{ "error": "Email atau password salah" }`.
- [x] **Skenario 3.4: Validasi input login**
  - Mengirim request dengan body kosong, field kurang, atau panjang string > 255 karakter.
  - Ekspektasi: HTTP 422.

---

### 4. Get Current User (`GET /api/users/current`)
- [x] **Skenario 4.1: Ambil profil user saat ini sukses (Happy Path)**
  - Login untuk mendapatkan token, lalu panggil endpoint dengan header `Authorization: Bearer <token>`.
  - Ekspektasi: HTTP 200, response body memuat objek `data` dengan properti `id`, `name`, `email`, dan `created_at`.
  - Verifikasi Keamanan: Pastikan properti `password` **TIDAK** ada dalam response data.
- [x] **Skenario 4.2: Tanpa header Authorization**
  - Mengirim request tanpa menyertakan header `Authorization`.
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.
- [x] **Skenario 4.3: Format header Authorization tidak valid**
  - Mengirim header tanpa format `Bearer ` (misal `Basic ...` atau token polos).
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.
- [x] **Skenario 4.4: Token salah / palsu / tidak ada di database**
  - Mengirim request dengan token sembarang yang tidak tercatat di tabel `sessions`.
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.

---

### 5. Logout User (`DELETE /api/users/logout`)
- [x] **Skenario 5.1: Logout sukses (Happy Path)**
  - Login untuk mendapatkan token, lalu panggil endpoint dengan header `Authorization: Bearer <token>`.
  - Ekspektasi: HTTP 200, response body `{ "data": "ok" }`.
  - Verifikasi DB: Session dengan token tersebut harus terhapus dari tabel `sessions`.
  - Verifikasi Lanjutan: Memanggil `GET /api/users/current` menggunakan token yang baru di-logout harus ditolak dengan HTTP 401.
- [x] **Skenario 5.2: Double logout (Token sudah tidak aktif)**
  - Mengirim request logout kedua kali dengan token yang sudah di-logout sebelumnya.
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.
- [x] **Skenario 5.3: Logout tanpa header Authorization**
  - Mengirim request logout tanpa menyertakan header Authorization.
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.
- [x] **Skenario 5.4: Logout dengan token palsu / tidak valid**
  - Mengirim request logout dengan token acak.
  - Ekspektasi: HTTP 401, response body `{ "error": "Unauthorized" }`.

---

## 🎯 Kriteria Selesai (Definition of Done)
1. Seluruh skenario pengujian di atas diimplementasikan di folder `test/`.
2. Perintah `bun test` dapat dijalankan dan menghasilkan **100% PASS** tanpa error.
3. Database kembali bersih setelah atau sebelum setiap pengujian dijalankan.
4. Perintah `bun check` tetap bebas dari error tipe TypeScript.
