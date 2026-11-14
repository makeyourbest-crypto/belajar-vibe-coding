# Plan: Implementasi API Logout User (`DELETE /api/users/logout`)

## 📌 Deskripsi Tugas
Implementasikan endpoint API untuk proses logout pengguna (`user logout`). Ketika user melakukan logout, token autentikasi yang dikirimkan via header Authorization akan diverifikasi, dan data session terkait yang tersimpan di tabel `sessions` akan dihapus dari database MySQL.

Panduan ini disusun secara terstruktur langkah demi langkah agar dapat diimplementasikan dengan mudah oleh junior programmer atau model AI.

---

## 📋 Spesifikasi Fitur

### 1. Spesifikasi Endpoint API
- **Method**: `DELETE`
- **Path**: `/api/users/logout`
- **Header**:
  - `Authorization`: `Bearer <token>` (token session milik user yang sedang aktif dan tersimpan di tabel `sessions`).

#### Response Body: Berhasil (HTTP Status 200)
Jika token valid dan session berhasil dihapus dari database:
```json
{
  "data": "ok"
}
```

#### Aturan Database:
- Data baris (*row*) pada tabel `sessions` yang memiliki nilai `token` sesuai dengan token yang dikirimkan **harus dihapus secara permanen** dari database.
- Setelah dihapus, token tersebut tidak lagi dapat digunakan untuk mengakses endpoint yang membutuhkan otentikasi (seperti `GET /api/users/current`).

#### Response Body: Gagal / Tidak Terotentikasi (HTTP Status 401)
Jika header `Authorization` tidak dikirim, format tidak sesuai (`Bearer <token>`), token kosong, atau token tidak ditemukan di tabel `sessions`:
```json
{
  "error": "Unauthorized"
}
```

---

## 📂 Aturan Struktur Folder & Penamaan File
Tetap mengikuti arsitektur berlapis (*layered architecture*) di dalam direktori `src/`:

```text
src/
├── db/
│   ├── index.ts              # Konfigurasi koneksi MySQL pool & Drizzle
│   └── schema.ts             # Definisi tabel (users, sessions, posts)
├── services/                 # Layer Business Logic
│   └── users-service.ts      # Logic validasi token dan penghapusan session dari database
├── routes/                   # Layer Routing & HTTP Controller
│   └── users-route.ts        # Route Elysia, ekstraksi header, pemanggilan service, mapping response
└── index.ts                  # Entry point utama aplikasi
```

---

## 🛠️ Tahapan Implementasi

### Tahap 1: Buat Business Logic di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Buat interface untuk hasil operasi logout:
   ```typescript
   export interface LogoutUserResult {
     success: boolean;
     error?: string;
   }
   ```
3. Tambahkan method statis `logoutUser(token: string): Promise<LogoutUserResult>` pada class `UserService`:
   - **Langkah 1.1: Validasi Parameter Token**:
     Jika token kosong atau falsy, kembalikan:
     `{ success: false, error: "Unauthorized" }`.
   - **Langkah 1.2: Periksa Keberadaan Session di Database**:
     Cari session di tabel `sessions`:
     ```typescript
     const [session] = await db
       .select({ id: sessions.id })
       .from(sessions)
       .where(eq(sessions.token, token))
       .limit(1);
     ```
     Jika session tidak ditemukan, return `{ success: false, error: "Unauthorized" }`.
   - **Langkah 1.3: Hapus Data Session dari Tabel `sessions`**:
     Jalankan operasi `delete` pada tabel `sessions`:
     ```typescript
     await db.delete(sessions).where(eq(sessions.token, token));
     ```
   - **Langkah 1.4: Kembalikan Status Sukses**:
     Return `{ success: true }`.

---

### Tahap 2: Tambahkan Endpoint `DELETE /logout` di Route (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler route `.delete("/logout", ...)` pada instance `usersRoute`:
   - **Langkah 2.1: Ekstraksi Header Authorization**:
     Ambil header `authorization` dari request context:
     ```typescript
     const authHeader = headers["authorization"];
     ```
   - **Langkah 2.2: Validasi Format Bearer Token**:
     Periksa apakah header tersedia dan berawalan `"Bearer "`:
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
     Panggil `UserService.logoutUser(token)`:
     - Jika `!result.success`:
       Set status `401` dan kembalikan response:
       ```json
       { "error": "Unauthorized" }
       ```
     - Jika `result.success`:
       Set status `200` dan kembalikan response:
       ```json
       { "data": "ok" }
       ```
3. Pastikan path endpoint lengkap menjadi `DELETE /api/users/logout` (karena prefix route adalah `/api/users`).

---

### Tahap 3: Verifikasi & Testing
Jalankan server aplikasi dan lakukan pengujian berbagai skenario:

1. **Uji Coba Logout Berhasil (Happy Path)**:
   - Login terlebih dahulu (`POST /api/users/login`) untuk mendapatkan `<token>`.
   - Kirim request logout:
     ```bash
     curl -X DELETE http://localhost:3000/api/users/logout \
       -H "Authorization: Bearer <token>"
     ```
   - *Ekspektasi*: HTTP Status `200` dengan response `{"data": "ok"}`.
   - *Verifikasi Database*: Pastikan baris data token tersebut sudah tidak ada lagi di tabel `sessions`.
   - *Verifikasi Invalidasi*: Coba panggil `GET /api/users/current` menggunakan token tersebut, pastikan sekarang mengembalikan status `401 Unauthorized`.

2. **Uji Coba Logout Ulang dengan Token yang Sudah Dihapus**:
   - Kirim request logout kedua kali dengan token yang sama persis:
     ```bash
     curl -X DELETE http://localhost:3000/api/users/logout \
       -H "Authorization: Bearer <token>"
     ```
   - *Ekspektasi*: HTTP Status `401` dengan response `{"error": "Unauthorized"}`.

3. **Uji Coba Token Tidak Valid / Palsu**:
   - Kirim request logout dengan token sembarang:
     ```bash
     curl -X DELETE http://localhost:3000/api/users/logout \
       -H "Authorization: Bearer token-acak-palsu"
     ```
   - *Ekspektasi*: HTTP Status `401` dengan response `{"error": "Unauthorized"}`.

4. **Uji Coba Tanpa Header Authorization**:
   - Kirim request logout tanpa menyertakan header Authorization:
     ```bash
     curl -X DELETE http://localhost:3000/api/users/logout
     ```
   - *Ekspektasi*: HTTP Status `401` dengan response `{"error": "Unauthorized"}`.

5. **Uji Typecheck**:
   - Jalankan `bun check` untuk memastikan seluruh kode TypeScript bebas dari error tipe.

---

## ✅ Checklist Implementasi (Action Items)
- [x] Method `logoutUser(token: string)` diimplementasikan di `src/services/users-service.ts`.
- [x] Pengecekan token session pada tabel `sessions`.
- [x] Eksekusi penghapusan record session (`db.delete(sessions)`) berdasarkan token.
- [x] Endpoint `DELETE /logout` ditambahkan pada `src/routes/users-route.ts`.
- [x] Validasi parsing header `Authorization: Bearer <token>`.
- [x] Mengembalikan HTTP 200 `{ "data": "ok" }` jika logout dan penghapusan session berhasil.
- [x] Mengembalikan HTTP 401 `{ "error": "Unauthorized" }` jika token tidak ditemukan atau header tidak valid.
- [x] Seluruh pengujian manual (happy path, double logout, token palsu, tanpa header) dan `bun check` lulus tanpa error.
