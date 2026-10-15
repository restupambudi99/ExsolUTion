# Audit fungsi Affiliate GO / AIMODE

Audit mencakup formulir, alur provider, API, penyimpanan, dan rendering 102 fitur. Bukti runtime REA serta fixture lokal disimpan pada `.sites-runtime/qa` yang diabaikan Git; fixture tidak dikirim ke production.

## Perbaikan

- Pengaturan Gemini/9Router membedakan key terisi, hasil uji koneksi, dan kesiapan model. Alur mengambil katalog dan memilih model ditampilkan sebelum generate.
- Pemeriksaan akun, key, model, rasio, foto wajib, dan kompatibilitas referensi berjalan sebelum kuota dan panggilan berbayar. Tidak ada perpindahan provider otomatis.
- Cabang formulir, pilihan rasio, jumlah hasil, dan unggahan aktif konsisten di browser dan server. Data cabang tersembunyi tidak ikut dikirim.
- Kegagalan katalog media opsional tidak membuang katalog lain yang berhasil dimuat. Semua hasil dan peringatan provider ditampilkan.
- Chat mempertahankan pertanyaan ketika gagal; foto serta pengaturan editor diingat saat berpindah alat. Foto yang sama dapat diunggah ulang setelah dihapus.
- Riwayat mendukung pagination, pesan gagal hapus, dan pembersihan hasil yang sudah dihapus dari cache layar. Kegagalan unduhan terlihat.
- Hapus Object mode manual memiliki canvas mask nyata, kuas, penghapus, bersihkan, keyboard, dan ekspor PNG. Mask divalidasi terpisah dari foto dan hanya dikirim pada mode manual.
- Rasio serta voice mengikuti adaptor yang dipilih. Kegagalan penyimpanan sebagian membersihkan file sementara dan tidak melaporkan hasil palsu.

## Verifikasi

- 60 tes kontrak/validasi/API/provider lulus; panggilan provider pada tes memakai mock, bukan kredit pengguna.
- TypeScript seluruh proyek lulus.
- REA mengunjungi 102 fitur dalam 21 batch lengkap; judul dan kontrol aksesibilitas teramati. Evidence final tidak memuat page exception atau HTTP 5xx.
- Satu HTTP 500 awal pada development `product-mockup` tercatat. GET ulang dan pengujian browser batch yang sama bersih; penyebab awal belum ditentukan.
- API lokal memverifikasi autentikasi, isolasi provider, penolakan origin/URL tidak valid, dan key yang belum tersedia tanpa panggilan generasi berbayar.
- Riwayat lokal sintetis: 35 entri berhasil dipaginasi; satu dihapus melalui API; UI memuat 30 lalu 34 entri dengan Muat Lebih Banyak.
- Editor lokal menghasilkan crop 1:1 berukuran 240×240 dari fixture 320×240, menerapkan preset Vintage, dan mengunduh PNG.
- Mode manual memuat canvas 320×240; Spasi menandai area dan mengaktifkan mask siap dikirim.

## Status layanan nyata

Uji terbaru pada situs dengan key yang diisi pemilik menghasilkan **HTTP 403 pada GET /v1/models**. Pesan lama menggabungkan 401 dan 403, sehingga kesimpulan bahwa key pasti salah ditarik kembali. Daftar model belum dapat dimuat dan validitas key belum dapat ditentukan dari hasil ini. Belum ada klaim keberhasilan generasi gambar, teks, atau suara dengan key tersebut.

Rendering 102 fitur tidak membuktikan mutu 102 keluaran AI. Upscale lokal memakai interpolasi, storyboard berupa rangkaian gambar, Opal tetap layanan eksternal, dan mask merupakan panduan visual; batas ini juga dijelaskan di UI/README.

## Pemeriksaan lanjutan autentikasi 9Router

Endpoint publik yang diberikan pemilik dapat dijangkau. `/api/health` dan `/api/version` mengembalikan HTTP 200; versi instance terdeteksi 0.5.55. Baseline tanpa kredensial dan dengan kredensial QA yang sengaja tidak valid sama-sama menghasilkan HTTP 401 pada `/v1/models`, dengan respons gate resmi `API key required for remote API access`.

Header `Authorization: Bearer` sesuai implementasi resmi 9Router v0.5.55. Gate memeriksa key yang cocok dan aktif pada database instance sebelum handler model berjalan. Bukti tersebut membedakan kegagalan autentikasi remote dari pemilihan model; bukti itu sendiri tidak menentukan apakah key pengguna tidak cocok, nonaktif, tersambung ke instance/database lain, atau header diubah proxy.

Pesan aplikasi sebelumnya menggabungkan HTTP 401/403 dan menyebut akses model secara umum. Diagnosis kini diperjelas dengan status serta endpoint; penolakan katalog opsional tidak membatalkan katalog utama yang sudah berhasil. Tidak ada perubahan key, pembuatan key, atau penonaktifan autentikasi pada VPS.

[Dokumentasi resmi Cloudflare](https://developers.cloudflare.com/workers/platform/known-issues/#fetch-to-ip-addresses) menyatakan fetch dari Workers harus menggunakan hostname, bukan IP langsung. Base URL yang diberikan masih berupa IP publik; konfigurasi ini perlu diganti dengan domain 9Router milik pemilik yang mengarah ke VPS, sebaiknya HTTPS. Koneksi lokal yang berhasil mencapai gate 401 tidak membuktikan koneksi hosted dapat memakai IP tersebut.
