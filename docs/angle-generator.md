# 21 Angle Generator

Menu berada pada grup **Sudut Kamera**, setelah grup tools lain. URL lokal: `/?tool=angle-generator`.

## Rekonstruksi referensi

Referensi: https://gemini.google.com/share/96d91ba32cb0?skid=78ec12bc-0e79-4162-a5ab-12d566b76448

Pada 16 Oktober 2026, tab browser Codex yang dipilih pengguna menampilkan aplikasi **21 Angle Generator**. Kontrol yang diamati: satu foto, 20 ekspresi opsional, tiga rasio, 21 sudut yang dapat dipilih sekaligus, dan unduhan PNG/JPG. Skrip aplikasi diekspor dari DOM iframe yang sudah terbuka, lalu dianalisis secara statis dengan REA. Tidak ada skrip referensi yang dijalankan ulang atau kredensial publisher yang digunakan dalam implementasi.

Evidence REA: `ev_fc393a7d6ab20d4be5a3433bc57e48470d7803838d3b0e88c867ada847612861`.
Digest artefak ekspor: `5ab2974b163a324610473e4390bf082b421a378dd7ac3e07b2d243ea9da311e7`.
Analisis memilih skrip aplikasi `script-12.js`; sebelas skrip bridge/library berada di luar cakupan. Ini membuktikan struktur kontrol dan kandidat alur panggilan, bukan keberhasilan generasi layanan referensi.

## Implementasi

- Satu request gambar per sudut dengan urutan kanonis; hingga 21 slot hanya untuk fitur ini. Batas tools lain tetap 10.
- Server memvalidasi tepat satu foto, daftar sudut unik, ekspresi, rasio, serta kecocokan indeks/jumlah slot sebelum memakai kuota provider.
- Prompt kamera ditentukan server per slot, mempertahankan identitas dan medium foto referensi. Sudut yang serupa memiliki arahan berbeda.
- Antrean, penghentian setelah request berjalan, retry kegagalan terkonfirmasi, dan pemulihan request memakai mekanisme ExsolUTion yang sudah ada. Request dengan hasil belum pasti tidak dikirim ulang otomatis.
- Nama sudut dan rasio disimpan dalam hasil sehingga riwayat dan pemulihan tetap konsisten.
- PNG/JPG benar-benar dikonversi melalui Canvas. Ekspor mengikuti 1080×1080, 1920×1080, atau 1080×1920; foto dipaskan tanpa distorsi atau crop diam-diam. Resolusi asli provider bisa berbeda.
- Menggunakan koneksi Gemini/9Router tersimpan. Generate tidak membuka dialog pengaturan otomatis.
- Kotak upload memakai input file native yang menutupi seluruh area klik. Pemilihan foto tidak bergantung pada aktivasi label atau dialog JavaScript; ikon, teks, dan ruang kosong menuju kontrol file yang sama. Nama aksesibel mengikuti judul kolom, fokus keyboard terlihat, dan pilihan tetap satu foto PNG/JPG/WebP maksimal 25 MB. Thumbnail dan tombol hapus berada di luar area input. Nilai input dikosongkan setelah FileList disalin agar foto yang sama dapat dipilih ulang.

## Validasi

Pembaruan upload 17 Oktober 2026 telah aktif sebagai versi 8. Di browser produksi, klik input native dan akses keyboard membuka pemilih file, PNG tampil pada thumbnail, pemilihan ulang file sama berhasil, serta pilihan satu sudut mengaktifkan tombol generate. File uji dibersihkan setelah pemeriksaan. Sebanyak 351 tes, TypeScript, dan build produksi lulus. Pemeriksaan ini tidak membuat permintaan generasi berbayar; lihat `docs/DEPLOYMENT.md` untuk provenance dan batas hasil.

- 290 tes otomatis lulus, termasuk pemilihan slot 21, validasi sebelum provider, satu output per slot, metadata riwayat/recovery, encoding unduhan, dan batas tools lain.
- Pemeriksaan TypeScript dan build produksi lulus.
- Browser desktop: menu, pilihan semua 21 sudut, ekspresi, rasio, unggahan satu foto, dan validasi inline diperiksa.
- Browser 390px: layout tanpa overflow horizontal dan pilihan semua 21 sudut diperiksa.
- Tidak ada pengujian generasi dengan provider nyata pada preview ini: belum ada konfigurasi AI untuk akun preview.

## Status penerbitan

Atas permintaan pengguna, source dan riwayat lengkap dipindahkan ke [repositori ExsolUTion](https://github.com/restupambudi99/ExsolUTion), dan Site pengganti dibuat dengan ID `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d`. Lihat [konteks proyek](PROJECT_CONTEXT.md) untuk status publikasi dan domain terbaru.

Proyek lama dipertahankan pada riwayat Git. Semua pengembangan dan penerbitan selanjutnya menggunakan identitas Site pada `.openai/hosting.json` checkout canonical; tidak memerlukan tautan chat lama. Riwayat runtime dan API key dari hosting lama tidak termasuk source atau migrasi ini.

Preview lokal dapat dijalankan dari direktori proyek dengan `node scripts/run-framework.mjs dev --port 5194`.
