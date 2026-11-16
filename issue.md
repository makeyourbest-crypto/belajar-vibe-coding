# Plan: Implementasi Swagger / OpenAPI Documentation Menggunakan `@elysiajs/swagger`

## 📌 Ringkasan Tugas
Integrasikan plugin dokumentasi Swagger/OpenAPI ke dalam aplikasi backend ElysiaJS agar pengguna, tim frontend, atau developer lain dapat dengan mudah membaca spesifikasi endpoint, melihat skema request/response, dan menguji API secara interaktif melalui browser.

Dokumen ini disusun sebagai panduan langkah demi langkah yang detail agar mudah diimplementasikan oleh junior programmer atau model AI pelaksana.

---

## 🛠️ Library & Dependensi yang Digunakan
- **Plugin**: [`@elysiajs/swagger`](https://elysiajs.com/plugins/swagger.html) (Plugin resmi Swagger UI & generator OpenAPI spec untuk framework ElysiaJS).
- **Package Manager**: Bun (`bun add @elysiajs/swagger`).

---

## 📋 Spesifikasi Fitur Swagger

### 1. Endpoint Dokumentasi
- **Swagger UI (Halaman Interaktif)**: `GET /swagger`
- **OpenAPI JSON Spec**: `GET /swagger/json`

### 2. Informasi Metadata Dokumentasi
- **Title**: `Belajar Vibe Coding API Documentation`
- **Version**: `1.0.0`
- **Description**: `Dokumentasi REST API interaktif untuk aplikasi Belajar Vibe Coding menggunakan runtime Bun, ElysiaJS, Drizzle ORM, dan MySQL.`
- **Tags Pengelompokan**:
  - `General`: Endpoint umum dan pemeriksaan kesehatan aplikasi (`GET /`, `GET /health`).
  - `Users`: Endpoint registrasi akun, otentikasi login, profil user aktif, dan logout session.

### 3. Skema Keamanan (*Security Scheme*)
Konfigurasi skema Bearer Token agar pengguna dapat menginput token hasil login langsung di tombol **"Authorize"** pada Swagger UI:
- **Security Scheme Name**: `bearerAuth`
- **Type**: `http`
- **Scheme**: `bearer`
- **Bearer Format**: `UUID`

---

## 🛠️ Tahapan Implementasi Langkah demi Langkah

### Tahap 1: Instalasi Dependensi `@elysiajs/swagger`
Jalankan perintah instalasi dependensi menggunakan Bun di terminal root proyek:
```bash
bun add @elysiajs/swagger
```
Pastikan `@elysiajs/swagger` tercatat pada bagian `dependencies` di `package.json`.

---

### Tahap 2: Daftarkan Plugin Swagger di Entry Point (`src/index.ts`)
1. Buka file `src/index.ts`.
2. Import fungsi `swagger` dari `@elysiajs/swagger`:
   ```typescript
   import { swagger } from "@elysiajs/swagger";
   ```
3. Pasang middleware `swagger` pada instance Elysia sebelum route-route lainnya terdaftar:
   ```typescript
   const app = new Elysia()
     .use(
       swagger({
         path: "/swagger",
         documentation: {
           info: {
             title: "Belajar Vibe Coding API Documentation",
             version: "1.0.0",
             description:
               "Dokumentasi REST API interaktif untuk aplikasi Belajar Vibe Coding menggunakan runtime Bun, ElysiaJS, Drizzle ORM, dan MySQL.",
           },
           tags: [
             { name: "General", description: "Endpoint umum dan status aplikasi" },
             { name: "Users", description: "Endpoint manajemen akun dan otentikasi session" },
           ],
           components: {
             securitySchemes: {
               bearerAuth: {
                 type: "http",
                 scheme: "bearer",
                 bearerFormat: "UUID",
                 description: "Masukkan token session UUID yang didapat dari endpoint login",
               },
             },
           },
         },
       })
     )
     .get("/", () => ({ ... }), {
       detail: {
         tags: ["General"],
         summary: "Root server status",
         description: "Mengembalikan status pesan selamat datang dan timestamp server.",
       },
     })
     .get("/health", () => ({ ... }), {
       detail: {
         tags: ["General"],
         summary: "Health check",
         description: "Pemeriksaan kesiapan server.",
       },
     })
     .use(usersRoute)
     .listen(port);
   ```

---

### Tahap 3: Lengkapi Metadata Dokumentasi pada Route Users (`src/routes/users-route.ts`)
Buka file `src/routes/users-route.ts` dan tambahkan properti `detail` pada opsi handler setiap endpoint:

1. **Endpoint `POST /` (Registrasi User)**:
   ```typescript
   {
     body: t.Object({ ... }),
     detail: {
       tags: ["Users"],
       summary: "Registrasi pengguna baru",
       description: "Mendaftarkan user baru dengan name (max 255), email unik (max 255), dan password (max 255).",
     },
   }
   ```

2. **Endpoint `POST /login` (Login User)**:
   ```typescript
   {
     body: t.Object({ ... }),
     detail: {
       tags: ["Users"],
       summary: "Login pengguna",
       description: "Memverifikasi kredensial pengguna dan menerbitkan session token UUID baru.",
     },
   }
   ```

3. **Endpoint `GET /current` (Get Current User Profile)**:
   ```typescript
   {
     detail: {
       tags: ["Users"],
       summary: "Ambil profil user saat ini",
       description: "Mengambil data profil pengguna yang sedang login berdasarkan Bearer token.",
       security: [{ bearerAuth: [] }],
     },
   }
   ```

4. **Endpoint `DELETE /logout` (Logout User)**:
   ```typescript
   {
     detail: {
       tags: ["Users"],
       summary: "Logout pengguna",
       description: "Menghapus session aktif pengguna berdasarkan Bearer token dari database.",
       security: [{ bearerAuth: [] }],
     },
   }
   ```

---

### Tahap 4: Verifikasi & Pengujian
Jalankan pengujian untuk memastikan Swagger UI dan fungsionalitas aplikasi berjalan sempurna:

1. **Uji Halaman Swagger UI**:
   - Jalankan server: `bun run dev`.
   - Buka URL `http://localhost:3000/swagger` di browser.
   - Pastikan antarmuka Swagger UI muncul dengan rapi, menampilkan kelompok tag `General` dan `Users`, serta tombol **"Authorize"** untuk Bearer token.
2. **Uji OpenAPI JSON Spec**:
   - Akses `http://localhost:3000/swagger/json`.
   - Pastikan menghasilkan data JSON OpenAPI v3 yang valid.
3. **Uji Integrasi / Unit Test**:
   - Jalankan `bun test` untuk memastikan penambahan middleware Swagger tidak mengganggu unit test yang sudah ada (harus 100% PASS).
4. **Uji Typecheck TypeScript**:
   - Jalankan `bun check` untuk memastikan tidak ada kesalahan tipe TypeScript.

---

## ✅ Checklist Implementasi (Action Items)
- [x] Install package `@elysiajs/swagger` menggunakan `bun add @elysiajs/swagger`.
- [x] Pasang plugin `swagger(...)` pada `src/index.ts` dengan metadata title, version, tags, dan security scheme `bearerAuth`.
- [x] Tambahkan properti `detail` (tags, summary, description) pada endpoint `GET /` dan `GET /health` di `src/index.ts`.
- [x] Tambahkan properti `detail` (tags, summary, description) pada endpoint registrasi dan login di `src/routes/users-route.ts`.
- [x] Tambahkan konfigurasi `security: [{ bearerAuth: [] }]` pada endpoint terproteksi (`GET /current` dan `DELETE /logout`) di `src/routes/users-route.ts`.
- [x] Pengujian akses ke `http://localhost:3000/swagger` berhasil menampilkan Swagger UI interaktif.
- [x] Pengujian akses ke `http://localhost:3000/swagger/json` mengembalikan format OpenAPI JSON yang valid.
- [x] Seluruh unit test lulus (`bun test`) dan bebas dari error tipe TypeScript (`bun check`).
