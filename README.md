# Belajar Vibe Coding - ElysiaJS + Bun + Drizzle + MySQL

Template dan starter kit backend modern menggunakan Bun, framework ElysiaJS, Drizzle ORM, dan database MySQL.

---

## 🛠️ Tech Stack
- **Runtime**: [Bun](https://bun.sh/) (v1.4+)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Database**: MySQL (`mysql2` driver)

---

## 📁 Struktur Direktori
```text
.
├── src/
│   ├── db/
│   │   ├── index.ts          # Setup pool koneksi & instance Drizzle
│   │   └── schema.ts         # Definisi tabel (users, posts, dll)
│   ├── routes/
│   │   └── users.ts          # Handler route REST API
│   └── index.ts              # Entry point server Elysia
├── drizzle/                  # Berkas migrasi SQL (drizzle-kit)
├── .env.example              # Template variabel lingkungan
├── .env                      # File konfigurasi lokal
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── package.json
└── tsconfig.json
```

---

## 🚀 Memulai (Quick Start)

### 1. Instalasi Dependensi
```bash
bun install
```

### 2. Konfigurasi Database (.env)
Salin `.env.example` ke `.env` dan sesuaikan koneksi database MySQL Anda:
```env
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/belajar_vibe_coding
```

### 3. Migrasi Database (Drizzle Kit)
- Generate migration file:
  ```bash
  bun run db:generate
  ```
- Push schema langsung ke MySQL:
  ```bash
  bun run db:push
  ```
- Jalankan migrasi:
  ```bash
  bun run db:migrate
  ```
- Buka Drizzle Studio (GUI Web Database):
  ```bash
  bun run db:studio
  ```

### 4. Menjalankan Server
- **Development (Hot Reload)**:
  ```bash
  bun run dev
  ```
- **Production**:
  ```bash
  bun run start
  ```

---

## 📡 Endpoint Contoh
- `GET /` - Root status & info
- `GET /health` - Health check status
- `GET /api/users` - Mengambil daftar user dari tabel MySQL
- `POST /api/users` - Menambahkan user baru (JSON payload: `{"name": "John", "email": "john@example.com"}`)
