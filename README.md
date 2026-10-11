# IPScope — frontend + backend

## Menjalankan secara lokal
1. Install Node.js versi 18 atau lebih baru.
2. Salin `.env.example` menjadi `.env`.
3. Isi API key provider yang kamu punya. Jangan unggah `.env` ke GitHub.
4. Jalankan:
   ```bash
   npm install
   npm start
   ```
5. Buka `http://localhost:3000`. Jangan membuka `public/index.html` langsung dari file manager; halaman perlu diakses melalui server.

## Provider
Backend mencoba memeriksa 10 provider bersamaan. DB-IP free dan ipapi.co memiliki endpoint tanpa key untuk penggunaan terbatas; provider lain dapat memerlukan API key/akun sesuai paket dan ketentuan yang berlaku. Jika key kosong, backend menampilkan "API key belum diatur" pada card provider itu.

## Deploy
Deploy folder ini sebagai Node.js web service pada host yang mendukung Node.js. Build command: `npm install`; start command: `npm start`. Atur environment variables di dashboard hosting, bukan di file HTML atau repository publik.

## Catatan
- Provider bisa gagal karena API key, CORS tidak lagi menjadi kendala utama karena permintaan dilakukan oleh backend, rate limit, perubahan API, atau batas paket.
- Gunakan rate limiting dan jangan menghapusnya pada endpoint publik.
- Geolokasi IP bersifat perkiraan.
