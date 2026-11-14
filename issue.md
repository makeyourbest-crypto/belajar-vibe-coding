# Plan: Implementasi API Get Current User (`GET /api/users/current`)

## 📌 Deskripsi Tugas
Implementasikan endpoint API untuk mengambil data profil pengguna yang sedang login (`current user`) berdasarkan token autentikasi Bearer yang dikirimkan melalui request header.

Panduan ini disusun secara terstruktur langkah demi langkah agar dapat diimplementasikan dengan mudah oleh junior programmer atau model AI.

---

## 📋 Spesifikasi Fitur

### 1. Spesifikasi Endpoint API
- **Method**: `GET`
- **Path**: `/api/users/current`
- **Header**:
  - `Authorization`: `Bearer <token>` (token session yang diperoleh saat login dan tersimpan di tabel `sessions`).

#### Response Body: Berhasil (HTTP Status 200)
Jika token valid dan session ditemukan:
```json
{
  "data": {
    "id": 1,
    "name": "eko",
    "email": "eko@localhost",
    "created_at": "2026-11-15T02:18:34.000Z"
  }
}
```
> **Catatan Keamanan**: Kolom sensitif seperti `password` **TIDAK BOLEH** disertakan dalam response data.

#### Response Body: Gagal / Tidak Terotentikasi (HTTP Status 401)
Jika header `Authorization` tidak dikirim, format tidak sesuai (`Bearer <token>`), token tidak ditemukan di tabel `sessions`, atau user tidak ada:
```json
{
  "error": "Unauthorized"
}
```

---

## 📂 Aturan Struktur Folder & Penamaan File
Tetap konsisten dengan arsitektur berlapis (*layered architecture*) di dalam direktori `src/`:

```text
src/
├── db/
│   ├── index.ts              # Konfigurasi koneksi MySQL pool & Drizzle
│   └── schema.ts             # Definisi tabel (users, sessions, posts)
├── services/                 # Layer Business Logic
│   └── users-service.ts      # Logic validasi token session dan retrieval data user
├── routes/                   # Layer Routing & HTTP Controller
│   └── users-route.ts        # Route Elysia, ekstraksi header, response mapping
└── index.ts                  # Entry point utama aplikasi
```

---

## 🛠️ Tahapan Implementasi

### Tahap 1: Tambahkan Method di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Buat interface untuk data return user dan result:
   ```typescript
   export interface CurrentUserResponse {
     id: number;
     name: string;
     email: string;
     created_at: Date | string;
   }

   export interface GetCurrentUserResult {
     success: boolean;
     user?: CurrentUserResponse;
     error?: string;
   }
   ```
3. Tambahkan method statis `getCurrentUser(token: string): Promise<GetCurrentUserResult>` pada class `UserService`:
   - **Langkah 1.1: Validasi Input Token**:
     Jika token kosong atau tidak valid, langsung kembalikan:
     `{ success: false, error: "Unauthorized" }`.
   - **Langkah 1.2: Cari Session di Database**:
     Query tabel `sessions` menggunakan Drizzle:
     ```typescript
     const [session] = await db
       .select()
       .from(sessions)
       .where(eq(sessions.token, token))
       .limit(1);
     ```
     Jika session tidak ditemukan, return `{ success: false, error: "Unauthorized" }`.
   - **Langkah 1.3: Ambil Data User Berdasarkan `userId` dari Session**:
     Query tabel `users` berdasarkan `session.userId`:
     ```typescript
     const [user] = await db
       .select({
         id: users.id,
         name: users.name,
         email: users.email,
         created_at: users.createdAt,
       })
       .from(users)
       .where(eq(users.id, session.userId))
       .limit(1);
     ```
     Jika user tidak ditemukan, return `{ success: false, error: "Unauthorized" }`.
   - **Langkah 1.4: Kembalikan Data User**:
     Return `{ success: true, user }`.

---

### Tahap 2: Tambahkan Endpoint `GET /current` di Route (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler route `.get("/current", ...)` pada instance `usersRoute`:
   - **Langkah 2.1: Ekstraksi Header Authorization**:
     Ambil header `authorization` dari request:
     ```typescript
     const authHeader = headers["authorization"];
     ```
   - **Langkah 2.2: Validasi Format Bearer Token**:
     Periksa apakah header ada dan diawali dengan `"Bearer "`:
     ```typescript
     if (!authHeader || !authHeader.startsWith("Bearer ")) {
       set.status = 401;
       return { error: "Unauthorized" };
     }
     const token = authHeader.slice(7).trim();
     if (!token) {
       set.status = 401;
       return { error: "Unauthorized" };
     }
     ```
   - **Langkah 2.3: Panggil Service**:
     Panggil `UserService.getCurrentUser(token)`:
     - Jika `!result.success`:
       Set status `401` dan kembalikan `{ error: "Unauthorized" }`.
     - Jika `result.success`:
       Set status `200` dan kembalikan `{ data: result.user }`.
3. Pastikan path endpoint lengkap menjadi `/api/users/current` (mengikuti prefix `/api/users`).

---

### Tahap 3: Verifikasi & Testing
Jalankan server aplikasi dan lakukan pengujian berbagai skenario:

1. **Uji Coba Berhasil (Happy Path)**:
   - Login terlebih dahulu (`POST /api/users/login`) untuk mendapatkan `<token>`.
   - Request profil dengan token valid:
     ```bash
     curl -X GET http://localhost:3000/api/users/current \
       -H "Authorization: Bearer <token>"
     ```
   - *Ekspektasi*: HTTP Status `200` dengan response data user lengkap (tanpa password):
     ```json
     {
       "data": {
         "id": 1,
         "name": "eko",
         "email": "eko@localhost",
         "created_at": "..."
       }
     }
     ```

2. **Uji Coba Token Tidak Valid / Palsu**:
   - Kirim request dengan token sembarang:
     ```bash
     curl -X GET http://localhost:3000/api/users/current \
       -H "Authorization: Bearer token-ngawur"
     ```
   - *Ekspektasi*: HTTP Status `401` dengan response `{"error": "Unauthorized"}`.

3. **Uji Coba Tanpa Header Authorization**:
   - Kirim request tanpa header Authorization:
     ```bash
     curl -X GET http://localhost:3000/api/users/current
     ```
   - *Ekspektasi*: HTTP Status `401` dengan response `{"error": "Unauthorized"}`.

4. **Uji Typecheck**:
   - Jalankan `bun check` untuk memastikan seluruh tipe data TypeScript valid tanpa error.

---

## ✅ Checklist Implementasi (Action Items)
- [x] Method `getCurrentUser(token: string)` diimplementasikan di `src/services/users-service.ts`.
- [x] Query pencarian session berdasarkan `token` pada tabel `sessions`.
- [x] Query user berdasarkan `userId` pada tabel `users` (hanya field `id`, `name`, `email`, `created_at` tanpa `password`).
- [x] Endpoint `GET /current` ditambahkan pada `src/routes/users-route.ts`.
- [x] Ekstraksi dan parsing header `Authorization: Bearer <token>`.
- [x] Mengembalikan HTTP 401 `{ "error": "Unauthorized" }` jika token tidak ada, salah format, atau session tidak valid.
- [x] Mengembalikan HTTP 200 `{ "data": { ... } }` jika autentikasi berhasil.
- [x] Seluruh pengujian (happy path, token salah, tanpa header) dan `bun check` lulus tanpa error.
