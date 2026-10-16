# Catatan penerbitan ExsolUTion

## Hasil 16 Oktober 2026

- GitHub authoritative: https://github.com/restupambudi99/ExsolUTion
- Produksi aktif: https://exsolution-studio.easybell32.chatgpt.site
- 21 Angle Generator: https://exsolution-studio.easybell32.chatgpt.site/?tool=angle-generator
- MCP dan OAuth resource terverifikasi dari Sites: https://exsolution-studio.easybell32.chatgpt.site/mcp
- Project ID: `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d`.
- Saved version 1: `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d~appgver_2ea69dfb14d08191a25219adbc57ac5c`.
- Deployment awal sukses: `appgdep_6ad1d087ac58819194ec3fac1d821ef0`.
- Deployment aktif setelah konfigurasi admin: `appgdep_6ad1d1a25b448191afd62badf36b97da`.
- Source commit versi tersebut: `c0730d9d90ca2fa96a605109350a03edad62c1c7`.
- Environment revision: 2; AES-GCM vault memakai secret baru dan admin dikonfigurasi dari identitas Site terverifikasi. Nilainya hanya disimpan pada Sites.
- Audience: custom, dengan dua akun yang telah disetujui pengguna. Nilai email dan token tidak disimpan di source.
- 290 tes, TypeScript, dan build produksi lulus. Migrasi schema disertakan di arsip dan diterapkan Sites ketika deploy.

Commit dokumentasi setelah commit source di atas tidak mengubah kode Worker yang sudah terbit. Gunakan sumber versi dan deployment sebagai provenance ketika memeriksa production.

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
