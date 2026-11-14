# Plan: Implementasi Registrasi User Baru (API & Service)

## 📌 Deskripsi Tugas
Implementasikan fitur registrasi user baru pada aplikasi backend ElysiaJS dengan database MySQL menggunakan Drizzle ORM. 

Panduan ini disusun secara terstruktur langkah demi langkah agar dapat diimplementasikan dengan mudah oleh junior programmer atau model AI.

---

## 📋 Spesifikasi Fitur

### 1. Spesifikasi Database: Tabel `users`
Perbarui schema Drizzle pada file `src/db/schema.ts` agar tabel `users` memiliki kolom-kolom berikut:
- **`id`**: integer, auto-increment, primary key (`serial("id")` atau `int("id").autoincrement().primaryKey()`)
- **`name`**: varchar(255), not null
- **`email`**: varchar(255), not null, unique
- **`password`**: varchar(255), not null (menyimpan hash bcrypt dari password asli)
- **`created_at`**: timestamp, default current timestamp, not null (`timestamp("created_at").defaultNow().notNull()`)

### 2. Spesifikasi Endpoint API
- **Method**: `POST`
- **Path**: `/api/users`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "eko",
  "email": "eko@localhost",
  "password": "rahasia"
}
```

#### Validasi Input
- `name`: string, tidak boleh kosong.
- `email`: string, format email valid, tidak boleh kosong.
- `password`: string, minimal panjang tertentu (misal min. 6 karakter), tidak boleh kosong.

#### Response Body: Berhasil (HTTP Status 200 atau 201)
```json
{
  "data": "OK"
}
```

#### Response Body: Gagal karena Email Duplikat (HTTP Status 400)
Jika email sudah terdaftar di database:
```json
{
  "error": "Email sudah terdaftar"
}
```

---

## 📂 Aturan Struktur Folder & Penamaan File
Pastikan mengikuti struktur arsitektur berlapis (*layered architecture*) di dalam direktori `src/`:

```text
src/
├── db/
│   ├── index.ts              # Konfigurasi koneksi database
│   └── schema.ts             # Schema tabel database (users, dll)
├── services/                 # Layer Business Logic
│   └── users-service.ts      # Logic registrasi, pengecekan email, hashing password
├── routes/                   # Layer Routing & HTTP Controller
│   └── users-route.ts        # Route Elysia, validasi schema request/response
└── index.ts                  # Entry point utama aplikasi (registrasi route)
```

> **Catatan Penting**:
> - Gunakan pemisah tanda hubung (*kebab-case*) untuk penamaan file di layer route dan service:
>   - Route: `users-route.ts`
>   - Service: `users-service.ts`
> - Rapikan file lama `src/routes/users.ts` jika digantikan oleh `users-route.ts`.

---

## 🛠️ Tahapan Implementasi

### Tahap 1: Perbarui Schema Database & Migrasi
1. Buka file `src/db/schema.ts`.
2. Tambahkan kolom `password: varchar("password", { length: 255 }).notNull()` pada tabel `users`.
3. Pastikan penamaan kolom di database sesuai spesifikasi:
   - `id`
   - `name`
   - `email` (tambahkan constraint unique)
   - `password`
   - `created_at`
4. Jalankan perintah migrasi:
   - `bun run db:generate` untuk membuat berkas migrasi SQL baru di folder `drizzle/`.
   - `bun run db:push` (atau migrasi) untuk menerapkan perubahan ke database MySQL.

---

### Tahap 2: Buat Business Logic di Service (`src/services/users-service.ts`)
1. Buat file baru `src/services/users-service.ts`.
2. Buat fungsi/class untuk registrasi, misalnya `registerUser({ name, email, password })`.
3. Alur kerja fungsi:
   - **Cek Duplikasi Email**: Query ke database mencari apakah user dengan email tersebut sudah ada.
     - Jika ada, lempar error atau kembalikan response bahwa email sudah terdaftar.
   - **Hash Password**: Gunakan algoritma bcrypt.
     - *Tips runtime Bun*: Anda dapat menggunakan fungsi bawaan Bun yang cepat tanpa dependensi tambahan:
       ```typescript
       const hashedPassword = await Bun.password.hash(password, {
         algorithm: "bcrypt",
         cost: 10,
       });
       ```
     - Atau gunakan library `bcryptjs` jika diinginkan.
   - **Simpan ke Database**: Insert data `{ name, email, password: hashedPassword }` ke tabel `users` menggunakan Drizzle.
   - **Return**: Kembalikan status sukses.

---

### Tahap 3: Buat Routing Elysia (`src/routes/users-route.ts`)
1. Buat file baru `src/routes/users-route.ts`.
2. Definisikan instance Elysia dengan prefix `/api/users`:
   - Gunakan schema validasi Elysia (`t.Object({ ... })`) untuk memvalidasi `name`, `email`, dan `password` pada request body.
3. Buat handler `POST /`:
   - Panggil fungsi `registerUser` dari `users-service.ts`.
   - Jika registrasi berhasil, return:
     ```json
     { "data": "OK" }
     ```
   - Jika service mendeteksi email duplikat, set status code HTTP ke `400` dan return:
     ```json
     { "error": "Email sudah terdaftar" }
     ```
4. Export route tersebut agar dapat digunakan di file entry point.

---

### Tahap 4: Daftarkan Route ke Entry Point (`src/index.ts`)
1. Buka `src/index.ts`.
2. Import `usersRoute` dari `./routes/users-route`.
3. Pasang route ke aplikasi Elysia menggunakan `.use(usersRoute)`.
4. Hapus referensi ke route lama jika ada.

---

### Tahap 5: Verifikasi & Testing
Jalankan server dengan `bun run dev` dan lakukan pengujian:

1. **Uji Coba Registrasi Berhasil (Happy Path)**:
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"name": "eko", "email": "eko@localhost", "password": "rahasia"}'
   ```
   *Ekspektasi*: HTTP 200/201 dengan response `{"data":"OK"}`. Password tersimpan di MySQL dalam bentuk hash bcrypt.

2. **Uji Coba Email Duplikat (Error Case)**:
   Kirim kembali request yang sama persis untuk kedua kalinya.
   *Ekspektasi*: HTTP 400 dengan response `{"error":"Email sudah terdaftar"}`.

3. **Uji Typecheck**:
   Jalankan `bun check` untuk memastikan tidak ada kesalahan tipe TypeScript.

---

## ✅ Checklist Implementasi (Action Items)
- [x] Schema `users` di `src/db/schema.ts` memiliki kolom `id`, `name`, `email`, `password`, dan `created_at`.
- [x] Berkas migrasi database digenerate via `bun run db:generate` dan diaplikasikan.
- [x] File `src/services/users-service.ts` dibuat untuk menangani pengecekan email, hashing bcrypt, dan penyimpanan data.
- [x] File `src/routes/users-route.ts` dibuat dengan validasi input Elysia (`t.Object`).
- [x] Handler `POST /api/users` mengembalikan `{ "data": "OK" }` jika sukses.
- [x] Handler `POST /api/users` mengembalikan `{ "error": "Email sudah terdaftar" }` jika email sudah ada (HTTP 400).
- [x] Route didaftarkan di `src/index.ts`.
- [x] Seluruh pengujian manual (happy path & duplicate case) dan `bun check` lulus tanpa error.
