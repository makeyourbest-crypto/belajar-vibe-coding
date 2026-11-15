# Bug: Validasi Panjang Maksimum (maxLength) pada Input User Belum Diterapkan

## 📌 Deskripsi Masalah
Saat melakukan registrasi user baru melalui endpoint `POST /api/users`, field `name`, `email`, dan `password` belum memiliki batasan panjang maksimum (*maximum length*) pada layer validasi ElysiaJS. 

Ketika dikirimkan payload dengan panjang karakter melebihi kapasitas kolom database (misalnya `name` dengan 300 karakter):
1. **Pada MySQL Non-Strict Mode**: Data tersimpan ke database namun karakternya dipotong secara diam-diam (*silent truncation*) menjadi 255 karakter tanpa peringatan kepada pengguna.
2. **Pada MySQL Strict Mode (`STRICT_TRANS_TABLES`)**: Database melempar error `ER_DATA_TOO_LONG: Data too long for column 'name'`, yang menyebabkan kegagalan fatal dengan respons `HTTP 500 Internal Server Error`.

---

## 🔍 Lokasi Masalah
- **File**: `src/routes/users-route.ts`
- **Bagian**: Schema validasi request body pada handler `POST /` (registrasi) dan `POST /login`:
  ```typescript
  body: t.Object({
    name: t.String({ minLength: 1 }),
    email: t.String({ minLength: 1 }),
    password: t.String({ minLength: 1 }),
  })
  ```
  *Masalah*: Hanya ada `minLength: 1`, tidak ada `maxLength: 255`.

---

## 🎯 Perilaku yang Diharapkan (Expected Behavior)
1. Layer validasi ElysiaJS harus menolak request yang memiliki field string melebihi batas kolom database (`VARCHAR(255)`).
2. Jika pengguna mengirimkan `name`, `email`, atau `password` dengan panjang lebih dari **255 karakter**, server harus langsung menolak di layer awal dengan status **HTTP 422 Unprocessable Content** (standar validasi Elysia) sebelum menyentuh database.
3. Jika panjang karakter antara 1 hingga 255, request diproses normal (HTTP 200 OK).

---

## 🛠️ Tahapan Perbaikan (Step-by-Step Guide)

### Tahap 1: Perbarui Schema Validasi Registrasi (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Cari bagian validasi body pada endpoint registrasi (`POST /`):
   ```typescript
   // SEBELUM:
   body: t.Object({
     name: t.String({ minLength: 1 }),
     email: t.String({ minLength: 1 }),
     password: t.String({ minLength: 1 }),
   })
   ```
3. Tambahkan properti `maxLength: 255` pada setiap field:
   ```typescript
   // SESUDAH:
   body: t.Object({
     name: t.String({ minLength: 1, maxLength: 255 }),
     email: t.String({ minLength: 1, maxLength: 255 }),
     password: t.String({ minLength: 1, maxLength: 255 }),
   })
   ```

---

### Tahap 2: Perbarui Schema Validasi Login (`src/routes/users-route.ts`)
1. Pada file yang sama (`src/routes/users-route.ts`), cari bagian validasi body pada endpoint login (`POST /login`).
2. Tambahkan batasan `maxLength: 255` untuk `email` dan `password`:
   ```typescript
   body: t.Object({
     email: t.String({ minLength: 1, maxLength: 255 }),
     password: t.String({ minLength: 1, maxLength: 255 }),
   })
   ```

---

### Tahap 3: Verifikasi & Testing
Jalankan server atau pengujian otomatis menggunakan Bun:

1. **Uji Coba Validasi Gagal (Karakter > 255)**:
   Kirim request registrasi dengan `name` sepanjang 300 karakter:
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"name": "'$(python -c "print('a'*300)")'", "email": "test@example.com", "password": "secretpassword"}'
   ```
   *Ekspektasi*:
   - Server merespon dengan status **HTTP 422 (Unprocessable Content)**.
   - Database tidak melakukan operasi INSERT apa pun.

2. **Uji Coba Validasi Berhasil (Karakter <= 255)**:
   Kirim request registrasi dengan `name` normal (misal 5 karakter atau tepat 255 karakter):
   *Ekspektasi*:
   - Server merespon dengan status **HTTP 200 OK** (`{"data": "OK"}`).

3. **Uji Typecheck TypeScript**:
   Jalankan perintah berikut di terminal:
   ```bash
   bun check
   ```
   *Ekspektasi*: Tidak ada type error.

---

## ✅ Checklist Perbaikan (Action Items)
- [x] Menambahkan `maxLength: 255` pada validasi `name`, `email`, dan `password` di endpoint registrasi (`src/routes/users-route.ts`).
- [x] Menambahkan `maxLength: 255` pada validasi `email` dan `password` di endpoint login (`src/routes/users-route.ts`).
- [x] Pengujian registrasi dengan `name` > 255 karakter menghasilkan status HTTP 422.
- [x] Pengujian registrasi dengan data normal (<= 255 karakter) berjalan sukses dengan status HTTP 200.
- [x] `bun check` lulus tanpa error.
