# Catatan penerbitan ExsolUTion

## Perbaikan Gemini 17 Oktober 2026

- Source produksi: `e6ccdc7c175dadcfda868ddb337e8e63f00c4fd1`.
- Saved version 7: `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d~appgver_b5d2499d6f0881918af8067d8c38b4d7`.
- Deployment `appgdep_6ad2ff5f9958819182cd28c7d3b8292f` **succeeded**, environment revision 2 dan MCP aktif. Domain utama tetap https://tools.restupambudi.my.id . Audience custom dipertahankan.
- 351 tes, TypeScript `--noEmit --incremental false`, dan build produksi lulus. Source hosting dan `origin/main` GitHub memuat merge kedua riwayat, termasuk commit GitHub `7e469bb5b66c03bf3693abc90b4370a343914445`; tidak ada force push.

Penyebab HTTP400 `INVALID_ARGUMENT` adalah format enum gambar: label UI `9:16`/`2K` sebelumnya dikirim langsung ke `responseFormat.image`. Adaptor sekarang memetakan 14 rasio dan tiga resolusi ke enum resmi. Acuan kontrak adalah discovery Google v1 revisi `20261015` serta https://ai.google.dev/api/generate-content#ImageResponseFormat . Tes memeriksa 42 kombinasi, alias, opsi otomatis, dan perlindungan nilai rahasia pada error. Input UI dan opsi tersimpan tetap memakai label semula.

Verifikasi online melalui browser Codex: satu permintaan teks dengan koneksi Gemini tersimpan berhasil membalas `OK`. Setelah deployment, batch empat gambar dengan foto referensi yang sudah ada tidak lagi terkena HTTP400 format; Google mengembalikan HTTP429 yang dipetakan ke `provider_quota_exceeded`. Satu slot gagal dan tiga slot belum dikirim; antrean tidak melanjutkan penolakan yang sama. Pengaturan AI tidak dibuka otomatis. Tab formulir tidak dimuat ulang sehingga foto referensi pengguna dipertahankan.

**Batas hasil:** gambar provider nyata belum berhasil dihasilkan, sehingga penyelesaian empat gambar dan unduh hasil baru belum dapat dibuktikan. Key diterima untuk teks/katalog, tetapi itu tidak membuktikan kuota gambar. Berdasarkan https://ai.google.dev/gemini-api/docs/pricing yang diperiksa 17 Oktober 2026, `gemini-3.1-flash-image` tidak menyediakan Free Tier API. Perlu memeriksa billing/kuota proyek yang memiliki key, atau memilih koneksi 9Router milik pengguna yang memiliki akses gambar. Tidak ada aktivasi billing, pembelian kredit, penggantian key, atau perpindahan provider otomatis pada pengujian ini. Jangan menyatakan layanan gambar siap produksi sebelum uji gambar dan unduh nyata berhasil.

Versi 4/5 sebelumnya menambahkan klasifikasi error bounded, pelaporan penyebab pada Hasil Kreasi, serta penghentian antrean untuk kegagalan bersama. Versi 6 dari `d731ec141d12468820eed5eae809b316f39048d3` tersimpan tetapi tidak diterbitkan; versi 7 memakai merge terverifikasi. Pengemasan sempat dihentikan pemeriksaan persetujuan otomatis karena receipt source mendahului merge. Hasil merge kemudian dicatat, dibuka ulang melalui source helper resmi, dibangun menjadi arsip baru dari SHA yang sama, lalu disimpan dan diterbitkan.

Commit dokumentasi verifikasi sesudah SHA produksi di atas tidak mengubah kode Worker.

## Hasil 16 Oktober 2026

- GitHub authoritative: https://github.com/restupambudi99/ExsolUTion
- Domain utama: https://tools.restupambudi.my.id
- Origin Sites alternatif: https://exsolution-studio.easybell32.chatgpt.site
- 21 Angle Generator: https://tools.restupambudi.my.id/?tool=angle-generator
- Panduan MCP & Plugin: https://tools.restupambudi.my.id/integrations
- MCP dan OAuth resource terverifikasi dari Sites: https://exsolution-studio.easybell32.chatgpt.site/mcp
- Project ID: `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d`.
- Saved version 1 awal: `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d~appgver_2ea69dfb14d08191a25219adbc57ac5c`.
- Deployment awal sukses: `appgdep_6ad1d087ac58819194ec3fac1d821ef0`.
- Deployment versi 2 sebelum pembaruan tautan domain: `appgdep_6ad1d4db271081919f0752e3e7cd87c9` (sukses).
- Source commit versi 2 tersebut: `46099bcd43659ce45573a9b759ce60b1fa1755bf`.
- Environment revision: 2; AES-GCM vault memakai secret baru dan admin dikonfigurasi dari identitas Site terverifikasi. Nilainya hanya disimpan pada Sites.
- Audience: custom, dengan dua akun yang telah disetujui pengguna. Nilai email dan token tidak disimpan di source.
- 295 tes, TypeScript, dan build produksi lulus untuk versi 2, termasuk perbaikan validasi key Gemini. Migrasi schema disertakan di arsip dan diterapkan Sites ketika deploy.

Commit dokumentasi setelah commit source di atas tidak mengubah kode Worker yang sudah terbit. Gunakan sumber versi dan deployment sebagai provenance ketika memeriksa production.

## Domain utama baru

Domain `tools.restupambudi.my.id` terhubung ke Site yang sama dengan ID domain `appgdom_6ad1d82a636481918cae1c1a1861a397`. Sites mengonfirmasi status domain **active**, provider **active**, SSL **active**, dan `current_live_url` pada domain tersebut. DNS Cloudflare memakai CNAME `tools` ke `custom-domains.chatgpt.site` dengan mode DNS only dan TTL Auto, serta dua TXT validasi dari Sites. Record lain dan nameserver tetap dipertahankan. Nilai TXT tidak perlu disalin ke repository.

Aktivasi domain tidak mengganti project ID, database, bucket, audience, atau secret. Endpoint MCP dan OAuth resource yang dikembalikan Sites tetap `https://exsolution-studio.easybell32.chatgpt.site/mcp`; jangan menggantinya dengan alias domain tanpa konfirmasi metadata platform. Status DNS/SSL dan pengujian login browser merupakan pemeriksaan terpisah; keberhasilan login yang tercatat di bawah dilakukan pada origin Sites.

Pembaruan tautan domain terbit sebagai saved version 3, source `ce290e91fb249860aad979b41dbfce0aa9000323`, deployment `appgdep_6ad1db3b88fc8191a4e8ea073178af86` (succeeded), environment revision 2 dan MCP aktif. Sebanyak 57 tes terkait MCP, TypeScript, dan build produksi lulus. `SITE_URL` memakai domain utama baru, sedangkan endpoint OAuth MCP tetap mengikuti metadata Sites. Commit dokumentasi verifikasi sesudahnya tidak mengubah Worker.

Verifikasi akhir pada domain utama: ketiga record DNS teresolusi; request HTTPS dengan validasi sertifikat normal menghasilkan HTTP401 dan gerbang login untuk pengunjung tanpa sesi. Setelah pengguna menyelesaikan login ChatGPT, aplikasi terbuka dan `/api/session` mengonfirmasi akun pemilik dengan ID pengguna Site yang sama seperti origin alternatif. Audience tetap custom dengan revision 2. Key Gemini/9Router belum tersimpan pada akun tersebut saat pemeriksaan; tidak ada klaim uji generasi provider nyata dari pemeriksaan domain ini.

## Domain lama

Percobaan menghubungkan `toolsaff.restupambudi.my.id` menghasilkan HTTP409 `custom_domain_conflict`: hostname sudah digunakan Site lama. Proyek lama tidak dapat dibaca oleh koneksi Sites saat ini. Alamat produksi baru di atas tetap berfungsi. Untuk memindahkan domain, binding lama harus dilepas dahulu oleh pemilik/pengelola yang memiliki akses atau melalui dukungan Sites; lalu gunakan `add_custom_domain` untuk Site baru dan terapkan hanya record validasi yang benar-benar dikembalikan.

## Login, data, dan provider

Platform meminta login ChatGPT sebelum aplikasi dapat dibuka. Pengguna menyelesaikan pemeriksaan keamanan dan login; akun pemilik telah diverifikasi melalui respons `/api/session` yang terautentikasi. Menu 21 Angle Generator terlihat di produksi. Database baru dimulai kosong. Hasil generasi, preferensi runtime, dan key tersimpan pada Site lama tidak ikut riwayat Git.

Provider 9Router sudah memiliki Base URL HTTPS dan ID model nonrahasia di environment, namun tidak ada API key global yang diimpor. Isi key melalui Pengaturan AI sekali pada Site baru; generasi provider nyata belum diuji pada hosting ini. `STUDIO_ADMIN_USER_IDS` sudah dikonfigurasi dari identitas terverifikasi Site baru; akses admin tidak diberikan dari ID akun global atau ID Site lama. Endpoint MCP siap, sedangkan instalasi/koneksi plugin pada tiap asisten merupakan langkah terpisah.

## Penerbitan berikutnya

1. Baca `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, dan manifest hosting. Reuse project ID tersebut; tidak perlu chat pembuatan lama.
2. Buka source Site melalui helper skill Sites dengan credential baru melalui stdin. Kredensial tidak disimpan ke file atau Git.
3. Lakukan perubahan di source GitHub, jalankan `npm test`, TypeScript, dan build. Pertahankan migrasi lama.
4. Helper Sites melakukan commit/push source hosting dan membuat archive dari commit yang sama. Save version lalu deploy, dengan audience custom tetap sama.
5. Push commit source tersebut ke `origin/main` GitHub tanpa force push. Konfirmasi hasil deploy sebelum memperbarui catatan ini.

Pada Windows, wrapper npm dengan path runtime Node/npm absolut dapat digunakan bila shim npm gagal. Git Bash tersedia sebagai `C:/Program Files/Git/bin/bash.exe`; tambahkan direktorinya ke PATH untuk helper paket Sites, dan set `TAR_OPTIONS=--force-local` saat path arsip menggunakan drive letter. Bila Git menolak kepemilikan checkout, gunakan `-c safe.directory=<absolute-checkout>` hanya pada command yang diperlukan, bukan pengecualian global untuk semua direktori.
