# Belajar Vibe Coding - ElysiaJS + Bun + Drizzle + MySQL

Aplikasi backend REST API modern dan berkinerja tinggi yang dibangun menggunakan runtime **Bun**, framework web **ElysiaJS**, ORM **Drizzle**, dan database **MySQL**. Aplikasi ini menyediakan modul manajemen pengguna lengkap dengan otentikasi berbasis session token, hashing password aman menggunakan Bcrypt, validasi input ketat, dan automated unit testing.

---

## 🛠️ Teknologi & Library yang Digunakan

| Kategori | Teknologi / Library | Keterangan |
| :--- | :--- | :--- |
| **Runtime & Toolchain** | [Bun](https://bun.sh/) (v1.4+) | Runtime JavaScript/TypeScript super cepat dan package manager bawaan |
| **Web Framework** | [ElysiaJS](https://elysiajs.com/) (v1.4+) | Framework HTTP ergonomis untuk Bun dengan type safety dan validasi skema |
| **ORM & Migrations** | [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit` | ORM TypeScript berbasis SQL dengan performa maksimal dan tipe data aman |
| **Database Driver** | `mysql2` | Driver koneksi MySQL dengan connection pool promise-based |
| **Database Engine** | MySQL / MariaDB (10.4+) | Sistem manajemen basis data relasional |
| **Bahasa Pemrograman**| TypeScript (v5+) | Static typing menyeluruh di seluruh layer aplikasi |
| **Password Hashing** | Native `Bun.password` (Bcrypt) | Algoritma hashing password bawaan Bun tanpa dependensi pihak ketiga |
| **Test Runner** | Native `bun:test` | Runner pengujian otomatis bawaan Bun dengan assertion lengkap |

---

## 🏗️ Arsitektur & Struktur Direktori

Aplikasi ini menggunakan pola **Layered Architecture** (arsitektur berlapis) dengan pemisahan tanggung jawab (*Separation of Concerns*) yang jelas antara routing/HTTP controller, logika bisnis, dan interaksi basis data.

```text
belajar-vibe-coding/
├── drizzle/                      # Berkas SQL migrasi yang dihasilkan oleh drizzle-kit
│   ├── meta/                     # Metadata snapshot skema Drizzle
│   ├── 0000_complex_typhoid_mary.sql
│   ├── 0001_charming_daredevil.sql
│   └── 0002_modern_sage.sql
├── src/
│   ├── db/
│   │   ├── index.ts              # Konfigurasi connection pool mysql2 & instance Drizzle
│   │   └── schema.ts             # Definisi skema tabel database (users, sessions, posts)
│   ├── routes/
│   │   └── users-route.ts        # Layer Route/Controller ElysiaJS & validasi skema request
│   ├── services/
│   │   └── users-service.ts      # Layer Business Logic (otentikasi, hashing, database query)
│   ├── utils/
│   │   └── auth.ts               # Helper fungsi otentikasi (ekstraksi header Bearer token)
│   └── index.ts                  # Entry point server aplikasi ElysiaJS
├── test/
│   ├── helpers/
│   │   └── reset-db.ts           # Utility pembersihan tabel database sebelum setiap pengujian
│   ├── index.test.ts             # Unit test endpoint root (GET /) & health check
│   └── users.test.ts             # Unit test lengkap seluruh endpoint users (auth & session)
├── .env.example                  # Template konfigurasi variabel lingkungan
├── .env                          # Konfigurasi lokal (diabaikan oleh git)
├── .gitignore                    # Berkas pengecualian Git
├── drizzle.config.ts             # Konfigurasi Drizzle Kit untuk MySQL
├── package.json                  # Manifest dependensi dan script npm
├── tsconfig.json                 # Konfigurasi compiler TypeScript
└── README.md                     # Dokumentasi utama proyek
```

### 📌 Konvensi Penamaan Berkas & Struktur
- **Routes**: Menggunakan format `*-route.ts` (contoh: `users-route.ts`). Bertanggung jawab menerima HTTP request, validasi skema request body/headers via Elysia `t.Object`, dan mengembalikan format HTTP response standar.
- **Services**: Menggunakan format `*-service.ts` (contoh: `users-service.ts`). Bertanggung jawab atas logika bisnis murni, pengecekan duplikasi, hashing password, pemanggilan query Drizzle, dan pembungkusan error.
- **Utils**: Berisi helper yang dapat digunakan kembali (*reusable functions*), seperti `extractBearerToken`.
- **Database (`src/db/`)**: Terpusat pada `index.ts` untuk connection pool dan `schema.ts` untuk deklarasi struktur tabel.
- **Tests (`test/`)**: Format file pengujian adalah `*.test.ts`.

---

## 🗄️ Skema Database

Basis data terdiri dari 3 tabel utama yang didefinisikan pada [`src/db/schema.ts`](src/db/schema.ts):

### 1. Tabel `users`
Menyimpan data akun pengguna yang terdaftar.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `serial` | PRIMARY KEY, AUTO_INCREMENT | Identifier unik pengguna |
| `name` | `VARCHAR(255)` | NOT NULL | Nama pengguna (1 - 255 karakter) |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Alamat email unik pengguna |
| `password` | `VARCHAR(255)` | NOT NULL | Hash password menggunakan algoritma Bcrypt |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Waktu akun dibuat |

### 2. Tabel `sessions`
Menyimpan token session pengguna yang sedang login aktif.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `serial` | PRIMARY KEY, AUTO_INCREMENT | Identifier unik session |
| `token` | `VARCHAR(255)` | NOT NULL, UNIQUE | Token otentikasi berupa string UUID |
| `user_id` | `INT` | NOT NULL, FOREIGN KEY | Relasi ke `users.id` (Cascade on delete) |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Waktu session dibuat saat login |

### 3. Tabel `posts`
Tabel sampel untuk keperluan pembuatan konten/artikel.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `serial` | PRIMARY KEY, AUTO_INCREMENT | Identifier unik post |
| `title` | `VARCHAR(255)` | NOT NULL | Judul post |
| `content` | `TEXT` | NULLABLE | Isi konten post |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | Waktu post dibuat |

---

## 📡 Daftar API yang Tersedia

Seluruh respon API mengikuti standar format JSON yang konsisten.

### Ringkasan Endpoint

| Method | Endpoint | Kebutuhan Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | Publik | Status server dan pesan selamat datang |
| `GET` | `/health` | Publik | Pemeriksaan kesehatan aplikasi (*health check*) |
| `POST` | `/api/users` | Publik | Mendaftarkan pengguna baru |
| `POST` | `/api/users/login` | Publik | Login pengguna & pembuatan session token |
| `GET` | `/api/users/current` | `Bearer Token` | Mengambil data profil pengguna yang sedang login |
| `DELETE` | `/api/users/logout` | `Bearer Token` | Logout pengguna & menghapus session dari database |

---

### Detail Spesifikasi Endpoint

#### 1. Root & Health Check
- **`GET /`**
  - **Response (200 OK)**:
    ```json
    {
      "message": "Server is running with ElysiaJS + Bun + Drizzle + MySQL!",
      "status": "ok",
      "timestamp": "2026-11-16T10:00:00.000Z"
    }
    ```
- **`GET /health`**
  - **Response (200 OK)**:
    ```json
    {
      "status": "healthy"
    }
    ```

---

#### 2. Registrasi Pengguna (`POST /api/users`)
Mendaftarkan akun baru ke sistem. Password otomatis dienkripsi dengan Bcrypt sebelum disimpan.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Eko Kurniawan",
    "email": "eko@example.com",
    "password": "rahasiaBanget123"
  }
  ```
  *Aturan validasi: Setiap field wajib diisi (panjang 1 - 255 karakter).*

- **Response Berhasil (200 OK)**:
  ```json
  {
    "data": "OK"
  }
  ```

- **Response Error Duplikat (400 Bad Request)**:
  ```json
  {
    "error": "Email sudah terdaftar"
  }
  ```

- **Response Error Validasi (422 Unprocessable Content)**:
  Muncul jika ada field yang kosong, hilang, atau melebihi 255 karakter.

---

#### 3. Login Pengguna (`POST /api/users/login`)
Memverifikasi kredensial pengguna dan menerbitkan session token UUID baru.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "eko@example.com",
    "password": "rahasiaBanget123"
  }
  ```

- **Response Berhasil (200 OK)**:
  ```json
  {
    "data": "a3b9f42a-7182-491b-85d7-f41256381bc9"
  }
  ```
  *(String pada `data` adalah token session UUID yang digunakan untuk endpoint terproteksi).*

- **Response Error Kredensial Salah (400 Bad Request)**:
  ```json
  {
    "error": "Email atau password salah"
  }
  ```
  *(Pesan disamakan untuk mencegah user enumeration).*

---

#### 4. Ambil Profil Pengguna Saat Ini (`GET /api/users/current`)
Mengambil data profil pengguna yang sedang login berdasarkan Bearer token.

- **Headers**:
  - `Authorization`: `Bearer <token-session>`

- **Response Berhasil (200 OK)**:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Eko Kurniawan",
      "email": "eko@example.com",
      "created_at": "2026-11-16T09:30:00.000Z"
    }
  }
  ```
  *(Kolom sensitif `password` disaring dan tidak disertakan).*

- **Response Error Otentikasi (401 Unauthorized)**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
  *(Muncul jika header Authorization tidak ada, format salah, atau token tidak ditemukan di basis data).*

---

#### 5. Logout Pengguna (`DELETE /api/users/logout`)
Mengakhiri session pengguna dan menghapus token terkait secara permanen dari basis data.

- **Headers**:
  - `Authorization`: `Bearer <token-session>`

- **Response Berhasil (200 OK)**:
  ```json
  {
    "data": "ok"
  }
  ```

- **Response Error Otentikasi (401 Unauthorized)**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
  *(Muncul jika token tidak valid atau session sudah terhapus sebelumnya).*

---

## 🚀 Panduan Setup Proyek

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **[Bun](https://bun.sh/)** versi 1.4.0 atau yang lebih baru.
- **MySQL / MariaDB Server** (misalnya via XAMPP, Laragon, atau Docker) yang berjalan pada port `3306`.

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/makeyourbest-crypto/belajar-vibe-coding.git
cd belajar-vibe-coding
bun install
```

### 3. Konfigurasi Environment (`.env`)
Salin template berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database MySQL pada berkas `.env`:
```env
PORT=3000
DATABASE_URL=mysql://root:@localhost:3306/belajar_vibe_coding

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=belajar_vibe_coding
```
> Pastikan database dengan nama `belajar_vibe_coding` sudah dibuat di MySQL Anda (`CREATE DATABASE IF NOT EXISTS belajar_vibe_coding;`).

### 4. Sinkronisasi & Migrasi Skema Database
Untuk menerapkan skema tabel ke dalam database MySQL, gunakan Drizzle Kit:

- **Push Skema Langsung ke MySQL**:
  ```bash
  bun run db:push
  ```
- **Generate Berkas Migrasi Baru**:
  ```bash
  bun run db:generate
  ```
- **Buka GUI Database Web (Drizzle Studio)**:
  ```bash
  bun run db:studio
  ```

---

## 💻 Cara Menjalankan Aplikasi

### Mode Development (Hot-Reload / Watch)
Menjalankan server dalam mode pengembangan. Setiap perubahan kode akan langsung dimuat ulang otomatis:
```bash
bun run dev
```
Server akan menyala pada: `http://localhost:3000`

### Mode Production
Menjalankan server langsung tanpa file watcher:
```bash
bun run start
```

---

## 🧪 Cara Menjalankan Pengujian (Testing)

Aplikasi ini dilengkapi pengujian otomatis menyeluruh (*automated unit & integration testing*) menggunakan test runner bawaan Bun (`bun:test`).

### 1. Menjalankan Seluruh Unit Test
```bash
bun test
```
atau
```bash
bun run test
```

> **Catatan Isolasi Data**: Pengujian dilengkapi dengan utility `resetDatabase()` pada hook `beforeEach` yang otomatis mengosongkan tabel `sessions` dan `users` sebelum setiap pengujian dijalankan. Hal ini memastikan setiap pengujian bersifat independen, konsisten, dan deterministik.

### 2. Memeriksa Tipe Data TypeScript (Typecheck)
Untuk memastikan tidak ada kesalahan kompilasi atau ketidakcocokan tipe data:
```bash
bun run typecheck
```
atau
```bash
bun check
```

---

## 📜 Lisensi
Proyek ini dibuat untuk keperluan pembelajaran dan pengembangan aplikasi modern (*Vibe Coding*). Bebas digunakan dan dikembangkan sesuai kebutuhan.
