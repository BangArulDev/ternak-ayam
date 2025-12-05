# Migrasi AyamPintar ke Node.js

Aplikasi ini telah dimigrasikan dari PHP ke Node.js menggunakan Hapi framework dan Webpack.

## Prasyarat

- Node.js terinstall.
- Database MySQL berjalan (XAMPP/WAMP) dengan konfigurasi yang sama seperti sebelumnya (Database: `whsfynns_ayamm_ternakk`).

## Cara Menjalankan

1.  **Install Dependencies** (jika belum):

    ```bash
    npm install
    ```

2.  **Build Frontend**:

    ```bash
    npm run build
    ```

3.  **Jalankan Server**:

    ```bash
    npm start
    ```

4.  Buka browser dan akses: `http://localhost:3000`

## Struktur Project

- `src/backend`: Kode server Node.js (Hapi).
  - `server.js`: Entry point.
  - `routes.js`: Definisi API dan route.
  - `db.js`: Koneksi database.
- `src/frontend`: Kode frontend (JavaScript, CSS, HTML).
  - `js/app.js`: Logika frontend utama.
  - `public`: Template HTML.
- `dist`: Hasil build Webpack (yang disajikan ke user).

## Fitur yang Dimigrasikan

- **Autentikasi**: Login dan Logout (menggunakan Cookies).
- **Dashboard**: Menampilkan statistik FCR, IP, BW, Sisa Pakan, dan Estimasi Omzet.
- **Input Harian**: Form input data harian (Mati, Pakan, BW).
- **Stok**: Input stok pakan/obat.
- **Siklus**: Memulai siklus baru.
- **Riwayat**: Menampilkan 5 data harian terakhir.

## Catatan

- Password user diverifikasi menggunakan `bcrypt` (kompatibel dengan `password_hash` PHP).
- Pastikan MySQL berjalan di port default (3306).
