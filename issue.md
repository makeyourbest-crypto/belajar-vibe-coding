# Plan: Implementasi Login User & Manajemen Session (API & Service)

## 📌 Deskripsi Tugas
Implementasikan fitur otentikasi login pengguna dan pembuatan token session pada aplikasi backend ElysiaJS dengan database MySQL menggunakan Drizzle ORM.

Panduan ini disusun secara terstruktur langkah demi langkah agar dapat diimplementasikan dengan mudah oleh junior programmer atau model AI.

---

## 📋 Spesifikasi Fitur

### 1. Spesifikasi Database: Tabel `sessions`
Tambahkan schema tabel baru `sessions` pada file `src/db/schema.ts` dengan kolom-kolom berikut:
- **`id`**: integer, auto-increment, primary key (`serial("id")` atau `int("id").autoincrement().primaryKey()`)
- **`token`**: varchar(255), not null (menyimpan string token UUID untuk user yang login)
- **`user_id`**: integer, not null, foreign key (`references(() => users.id)`)
- **`created_at`**: timestamp, default current timestamp, not null (`timestamp("created_at").defaultNow().notNull()`)

---

### 2. Spesifikasi Endpoint API Login
- **Method**: `POST`
- **Path**: `/api/users/login`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "eko@localhost",
  "password": "rahasia"
}
```

#### Validasi Input
- `email`: string, format email valid, tidak boleh kosong.
- `password`: string, tidak boleh kosong.

#### Response Body: Berhasil (HTTP Status 200)
```json
{
  "data": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
*(Nilai `"data"` berupa string token UUID yang baru dibuat dan tersimpan di tabel `sessions`).*

#### Response Body: Gagal (HTTP Status 400)
Jika email tidak ditemukan atau password tidak sesuai hash bcrypt:
```json
{
  "error": "Email atau password salah"
}
```

> **Catatan Keamanan**: Pesan error disamakan ("Email atau password salah") baik ketika email tidak ditemukan maupun password salah untuk mencegah *user enumeration*.

---

## 📂 Aturan Struktur Folder & Penamaan File
Gunakan arsitektur berlapis (*layered architecture*) di dalam direktori `src/`:

```text
src/
├── db/
│   ├── index.ts              # Konfigurasi koneksi MySQL pool & Drizzle
│   └── schema.ts             # Definisi tabel (users, posts, sessions)
├── services/                 # Layer Business Logic
│   └── users-service.ts      # Logic otentikasi, verifikasi hash bcrypt, pembuatan token UUID & session
├── routes/                   # Layer Routing & HTTP Controller
│   └── users-route.ts        # Route Elysia, validasi schema request/response
└── index.ts                  # Entry point utama aplikasi
```

- Route menggunakan format penamaan: `users-route.ts`
- Service menggunakan format penamaan: `users-service.ts`

---

## 🛠️ Tahapan Implementasi

### Tahap 1: Tambahkan Schema `sessions` & Migrasi Database
1. Buka file `src/db/schema.ts`.
2. Import helper tipe kolom yang diperlukan (`int`, dsb.) dari `drizzle-orm/mysql-core`.
3. Definisikan tabel `sessions`:
   - `id`: `serial("id").primaryKey()` atau `int("id").autoincrement().primaryKey()`
   - `token`: `varchar("token", { length: 255 }).notNull().unique()`
   - `userId`: `int("user_id").notNull().references(() => users.id)`
   - `createdAt`: `timestamp("created_at").defaultNow().notNull()`
4. Export tabel `sessions`.
5. Jalankan migrasi:
   - `bun run db:generate` untuk membuat berkas migrasi SQL baru di `drizzle/`.
   - `bun run db:push` (atau migrasi) untuk menerapkan tabel ke database MySQL.

---

### Tahap 2: Tambahkan Method Login di Service (`src/services/users-service.ts`)
1. Buka `src/services/users-service.ts`.
2. Import tabel `sessions` dari `../db/schema`.
3. Buat interface data input dan hasil login:
   ```typescript
   export interface LoginUserInput {
     email: string;
     password: string;
   }

   export interface LoginUserResult {
     success: boolean;
     token?: string;
     error?: string;
   }
   ```
4. Tambahkan method statis `loginUser(input: LoginUserInput): Promise<LoginUserResult>` pada class `UserService`:
   - **Langkah 2.1: Cari User**:
     Query user dari database berdasarkan `email`. Jika tidak ada user yang cocok, return:
     `{ success: false, error: "Email atau password salah" }`.
   - **Langkah 2.2: Verifikasi Password**:
     Gunakan fungsi verifikasi password bawaan Bun:
     ```typescript
     const isPasswordValid = await Bun.password.verify(input.password, user.password);
     ```
     Jika `isPasswordValid` bernilai `false`, return:
     `{ success: false, error: "Email atau password salah" }`.
   - **Langkah 2.3: Generate Token Session**:
     Generate token UUID menggunakan native Bun/Web Crypto API:
     ```typescript
     const token = crypto.randomUUID();
     ```
   - **Langkah 2.4: Simpan Session**:
     Insert ke tabel `sessions`:
     ```typescript
     await db.insert(sessions).values({
       token: token,
       userId: user.id,
     });
     ```
   - **Langkah 2.5: Kembalikan Token**:
     Return `{ success: true, token }`.

---

### Tahap 3: Tambahkan Endpoint di Route (`src/routes/users-route.ts`)
1. Buka `src/routes/users-route.ts`.
2. Tambahkan handler route `POST /login` pada instance `usersRoute`:
   ```typescript
   .post(
     "/login",
     async ({ body, set }) => {
       const result = await UserService.loginUser({
         email: body.email,
         password: body.password,
       });

       if (!result.success) {
         set.status = 400;
         return {
           error: result.error,
         };
       }

       set.status = 200;
       return {
         data: result.token,
       };
     },
     {
       body: t.Object({
         email: t.String({ minLength: 1 }),
         password: t.String({ minLength: 1 }),
       }),
     }
   )
   ```
3. Pastikan path lengkap endpoint menjadi `/api/users/login` (karena prefix route adalah `/api/users`).

---

### Tahap 4: Verifikasi & Testing
Jalankan server dan uji coba alur login:

1. **Uji Coba Login Berhasil (Happy Path)**:
   - Pastikan user sudah terdaftar terlebih dahulu (misal: `eko@localhost` dengan password `rahasia`).
   - Kirim request login:
     ```bash
     curl -X POST http://localhost:3000/api/users/login \
       -H "Content-Type: application/json" \
       -d '{"email": "eko@localhost", "password": "rahasia"}'
     ```
   - *Ekspektasi*: HTTP 200 dengan format response `{"data": "<uuid-token>"}`.
   - Periksa database: Record token baru tersimpan di tabel `sessions` dengan `user_id` milik user tersebut.

2. **Uji Coba Password Salah**:
   - Kirim request dengan password keliru:
     ```bash
     curl -X POST http://localhost:3000/api/users/login \
       -H "Content-Type: application/json" \
       -d '{"email": "eko@localhost", "password": "passwordsalah"}'
     ```
   - *Ekspektasi*: HTTP 400 dengan response:
     ```json
     { "error": "Email atau password salah" }
     ```

3. **Uji Coba Email Tidak Terdaftar**:
   - Kirim request dengan email yang belum pernah didaftarkan:
     ```bash
     curl -X POST http://localhost:3000/api/users/login \
       -H "Content-Type: application/json" \
       -d '{"email": "tidakada@localhost", "password": "rahasia"}'
     ```
   - *Ekspektasi*: HTTP 400 dengan response:
     ```json
     { "error": "Email atau password salah" }
     ```

4. **Uji Typecheck**:
   - Jalankan `bun check` untuk memastikan seluruh tipe data TypeScript valid tanpa error.

---

## ✅ Checklist Implementasi (Action Items)
- [x] Schema `sessions` ditambahkan pada `src/db/schema.ts` dengan foreign key ke `users.id`.
- [x] Berkas migrasi database digenerate via `bun run db:generate` dan diaplikasikan.
- [x] Method `loginUser` diimplementasikan di `src/services/users-service.ts`.
- [x] Verifikasi password menggunakan `Bun.password.verify`.
- [x] Token UUID digenerate via `crypto.randomUUID()` dan disimpan ke tabel `sessions`.
- [x] Endpoint `POST /api/users/login` ditambahkan di `src/routes/users-route.ts`.
- [x] Handler mengembalikan HTTP 200 `{ "data": "<token>" }` jika login sukses.
- [x] Handler mengembalikan HTTP 400 `{ "error": "Email atau password salah" }` jika gagal.
- [x] Seluruh pengujian manual (happy path, password salah, email tidak terdaftar) dan `bun check` lulus tanpa error.
