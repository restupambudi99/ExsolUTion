# Affiliate Go Studio

Implementasi SaaS mandiri berdasarkan referensi [Affiliate GO di Gemini Canvas](https://gemini.google.com/share/50a05a6652ae). Registry mencakup **82 menu utama dan 20 mode tambahan**, dalam satu kelompok umum dan delapan kelompok fitur. Formulir menyediakan 780 kontrol dengan 2.888 pilihan bernama. Jumlah ini menunjukkan cakupan menu dan formulir; keberhasilan setiap keluaran AI tetap bergantung pada provider dan akses model.

Antarmuka dan kode aplikasi ditulis ulang. Nama menu serta label kontrol mengikuti bukti yang diamati melalui REA. Kode executable, prompt panjang, kredensial, autentikasi pembelian, dan layanan backend publisher tidak digunakan oleh aplikasi ini. Artefak investigasi lokal berada di `.rea/reference` pada root workspace, diabaikan Git dan tidak termasuk deployment. Evidence browser: `ev_b5493bc4c78212470f54c5b8489a102fa0fc93df2cb71d46fa7aef54305cf02c`; analisis JavaScript: `ev_69a6992c192f682e8b3545047655247ecdfe6f596a69e3f44da23fd1671ea357`. Bukti tersebut memiliki batas cakupan dan tidak membuktikan seluruh perilaku runtime layanan asli.

## Menjalankan di Windows

Gunakan Node.js **22.13.0 atau lebih baru** dan npm. Jalankan dari folder `sites/affiliate-go`; `npm.cmd` adalah executable npm Windows yang dapat dipakai di PowerShell tanpa menjalankan shim `npm.ps1`.

```powershell
npm.cmd run install:ci
Copy-Item .env.example .dev.vars
npm.cmd run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_broken_lester.sql
npm.cmd run dev
```

Salin `.env.example` sekali pada setup awal, lalu isi `.dev.vars` sesuai kebutuhan. File tersebut diabaikan Git. Migrasi SQL di atas diterapkan sekali ke database lokal baru; jangan mengulang migrasi yang sudah diterapkan. Buka URL Local yang tercetak di terminal, biasanya `http://localhost:5173`.

Preview development menyediakan login lokal melalui `/signin-with-chatgpt?return_to=/`. Identitas mock ini hanya berlaku pada development loopback dan tidak ikut ke production.

Untuk preview hasil build:

```powershell
npm.cmd run build
npm.cmd start
```

`npm start` menjalankan Worker lokal, tidak melakukan deployment dan tidak menyediakan mock login development. Gunakan `npm run dev` untuk menguji alur akun lokal. Script lain yang tersedia: `npm.cmd run db:generate` setelah perubahan schema, serta `npm.cmd run lint` untuk pemeriksaan lint.

## Konfigurasi AI

Nama environment tersedia di `.env.example`:

| Variable | Fungsi / default aplikasi |
| --- | --- |
| `GEMINI_API_KEY` | Key Google Gemini untuk provider Gemini. |
| `GEMINI_IMAGE_MODEL` | `gemini-3.1-flash-image` |
| `GEMINI_TEXT_MODEL` | `gemini-3.8-flash` |
| `GEMINI_AUDIO_MODEL` | `gemini-3.8-flash-tts` |
| `NINEROUTER_API_KEY` | Key 9Router untuk koneksi server opsional. |
| `NINEROUTER_BASE_URL` | Base URL publik instance 9Router, termasuk `/v1`; HTTPS diprioritaskan. |
| `NINEROUTER_ALLOWED_HTTP_ORIGINS` | Origin HTTP publik yang diizinkan eksplisit oleh administrator, dipisahkan koma. |
| `NINEROUTER_TEXT_MODEL` | ID model teks dari instance 9Router. |
| `NINEROUTER_IMAGE_MODEL` | ID model gambar dari instance 9Router. |
| `NINEROUTER_AUDIO_MODEL` | ID model suara dari instance 9Router. |
| `NINEROUTER_VOICE` | Override voice opsional, jika adaptor 9Router memerlukannya. |

Pilih override model yang tersedia bagi akun API pengguna. Pada hosted Site, atur key sebagai **runtime secret melalui Sites**, lalu deploy ulang saved version agar konfigurasi diterapkan. Jangan menaruh key pada source, manifest hosting, atau bundle client.

Pengaturan AI menyediakan pilihan **Gemini** atau **9Router** dan menunjukkan provider yang sedang aktif. Key masing-masing provider disimpan terpisah dalam memori sesi, tetap tersedia saat berganti provider, dan hilang setelah reload atau keluar. Key tidak masuk localStorage, database preferensi, atau riwayat. Aplikasi mengirim hanya key provider yang dipilih. Key yang diisi pengguna mendapat prioritas atas key server untuk provider tersebut; perpindahan provider tidak melakukan fallback otomatis ke provider lain.

Untuk 9Router, isi Base URL dari instance Anda, jalankan **Tes koneksi**, lalu pilih ID model teks, gambar, dan suara dari katalog yang tersedia atau masukkan ID yang sesuai. Tidak ada Base URL cloud universal yang diasumsikan. Situs hosted membutuhkan endpoint publik; `localhost` pada komputer pengguna tidak dapat dijangkau Worker hosted. HTTPS diprioritaskan. Endpoint HTTP hanya diterima bila origin persis terdaftar pada `NINEROUTER_ALLOWED_HTTP_ORIGINS`; alamat loopback, metadata, dan jaringan privat tetap ditolak. URL yang memuat username, password, atau query ditolak. Pengaturan menampilkan keterangan bahwa key dan input ke origin HTTP dikirim tanpa enkripsi. Konfigurasi Site ini memakai endpoint yang diberikan pemilik: `http://38.47.191.228:20128/v1`.

Pengaturan menampilkan langkah **Hubungkan → Ambil Model → Pilih Model**. Key saja belum cukup untuk 9Router: pilih model gambar untuk fitur foto, model teks untuk chat/analisis, dan model suara untuk voice over. Model otomatis dipilih hanya jika terdapat tepat satu pilihan yang sesuai; aplikasi tidak menebak ID model. Tombol generate mengarahkan ke pengaturan bila model atau referensi wajib belum lengkap.

Jika uji koneksi menghasilkan **401 / API key tidak valid**, key belum diterima instance 9Router tersebut. Salin key aktif dari menu API Keys pada dashboard instance yang sama; key Gemini, hash key, atau key untuk server lain tidak dapat menggantikannya. Isi key langsung pada kolom password aplikasi, bukan pada prompt atau URL.

Tes koneksi memeriksa endpoint daftar model, bukan membuat hasil AI. Daftar chat, gambar, dan suara memakai katalog terpisah. Dukungan foto referensi bergantung pada adaptor upstream 9Router; model yang tidak mendukung referensi menghasilkan pesan yang jelas dan tidak membuang foto secara diam-diam. Kuota dan biaya generasi mengikuti akun provider pengguna. Editor foto lokal tetap bekerja tanpa key.

Provider yang dipilih dan konfigurasi model nonrahasia dapat diingat di browser untuk profil pengguna tersebut. Status key siap dan hasil tes koneksi dibedakan; menyimpan key tidak dianggap sebagai bukti koneksi berhasil. Pengaturan provider tidak dapat diubah saat proses generasi sedang berjalan.

Kontrak endpoint 9Router mengikuti [dokumentasi resmi](https://github.com/decolua/9router): chat `/chat/completions`, gambar `/images/generations`, dan suara `/audio/speech`. Model dan format yang tersedia mengikuti versi serta koneksi upstream pada instance pengguna. Kegagalan katalog media opsional ditampilkan sebagai peringatan tanpa menghilangkan katalog teks yang berhasil dimuat. Kemampuan rasio gambar mengikuti adaptor upstream; aplikasi tidak mengubah rasio pilihan menjadi dimensi lain lalu mengklaim keduanya sama.

## Akun, penyimpanan, dan publishing

Site dipublikasikan dengan akses privat melalui Sites. Login hosted memakai identitas ChatGPT yang disediakan platform; email pembelian aplikasi referensi tidak digunakan sebagai otorisasi. Form profil lokal hanya membuat profil tampilan dan tidak memverifikasi pembelian.

Manifest `.openai/hosting.json` mengikat D1 sebagai `DB` dan R2 sebagai `BUCKET`. Riwayat hasil AI serta preferensi terkait identitas pengguna disimpan server-side; file hasil berada di R2 dan aksesnya diperiksa per pengguna. Etalase produk disimpan pada browser. Database lokal `.wrangler/state` terpisah dari database hosted.

Publikasikan melalui workflow plugin Sites. Pertahankan `project_id` dan binding yang sudah ada; `npm start` bukan perintah publishing. Sites menerapkan migrasi hosted pada deployment. Data runtime, `.dev.vars`, serta state lokal tidak masuk paket source.

## Batas kesetaraan dengan referensi

- **Upscale** memakai interpolasi canvas berkualitas tinggi 2×/4×. Layanan ESRGAN berbayar pada referensi tidak terhubung; interpolasi tidak menghasilkan detail AI yang sama.
- **Photo Editor** memproses foto pada browser: 20 preset, delapan penyesuaian cahaya/warna, grain, crop, rotasi, flip, resize, dan export. Parameter preset merupakan implementasi baru.
- **Hapus Object — Manual (Brush)** menyediakan canvas untuk membuat, menghapus, membersihkan, dan mengunduh mask PNG. Foto sumber dan mask dikirim sebagai panduan visual; hasil bukan inpainting yang presisi per piksel. Pada 9Router, mode ini membutuhkan adaptor yang menerima beberapa referensi.
- **Video Analyzer** mengambil frame secara lokal, lalu menganalisis gambar frame melalui provider yang dipilih. **Video Frames** dan **Story Board** menghasilkan rangkaian gambar; bukan file film hasil rendering. Pilihan storyboard dan ekstraksi frame dibatasi maksimal 10 sesuai pemrosesan aplikasi.
- **Opal** membuka halaman Google Opal eksternal. Referensi harus diunggah kembali di sana; akses, kuota, dan rendering mengikuti layanan eksternal tersebut.
- **Face Swap** dan **Hapus Background** memakai provider gambar yang dikonfigurasi, menggantikan web view eksternal pada referensi. Ketepatan wajah, tepi cutout, dan transparansi bergantung pada model.
- Pembayaran, langganan publisher, dan aktivasi email pembelian tidak dikloning. Hasil AI tidak dapat dijamin identik dengan referensi. Antarmuka menyediakan Indonesia, English, dan Melayu; beberapa istilah pilihan mengikuti label sumber.
