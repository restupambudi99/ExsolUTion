# Konteks proyek ExsolUTion

Dokumen ini menyimpan keputusan proyek agar pengembangan berikutnya dapat dilanjutkan dari repository, tanpa meminta tautan percakapan lama. Baca bersama `AGENTS.md`, `README.md`, dan `.openai/hosting.json` sebelum mengubah atau menerbitkan aplikasi.

## Sumber yang menjadi acuan

- Repository utama: **https://github.com/restupambudi99/ExsolUTion.git**.
- Root repository berisi aplikasi langsung: `app/`, `lib/`, `components/`, `db/`, `drizzle/`, `public/`, `scripts/`, dan `package.json`. Tidak perlu membuat folder aplikasi bersarang lagi.
- Checkout canonical pada workspace asal: `C:/Users/Meta/Documents/ChatGPT/REA/sites/exsolution`. Lokasi checkout pada komputer lain boleh berbeda.
- Checkout lama `C:/Users/Meta/Documents/ChatGPT/REA/sites/affiliate-go` disimpan sebagai sumber historis lokal, bukan lokasi pengembangan aktif.
- History aplikasi sejak implementasi awal dipertahankan. Perubahan 21 Angle Generator dan pemindahan hosting dilanjutkan sebagai commit berikutnya; jangan mengganti history dengan satu commit baru atau melakukan force push.

Pengguna telah meminta agar seluruh source proyek dan perkembangan selanjutnya disimpan pada repository utama tersebut. Untuk pekerjaan implementasi yang diminta pengguna, periksa diff, jalankan pemeriksaan yang sesuai, commit perubahan yang relevan, lalu push ke repository itu melalui autentikasi GitHub yang tersedia. Jika push gagal karena autentikasi atau izin, pertahankan commit lokal dan laporkan hambatan sebenarnya. Jangan meminta kembali chat pembuat website untuk menemukan source.

## Hosting aktif dan domain

| Komponen | Identitas |
| --- | --- |
| Site baru | `appgprj_6ad1ce23b43081919d3f1a5e485c2a2d` |
| Origin Site baru | `https://exsolution-studio.easybell32.chatgpt.site` |
| Manifest sumber | `.openai/hosting.json` |
| Binding database | `DB` |
| Binding file | `BUCKET` |
| Capability platform | `mcp` |
| Domain yang ingin digunakan | `https://toolsaff.restupambudi.my.id` |

Site lama `appgprj_6acfac3a374c8191b6c74ab684fa837b` sudah tidak menjadi tujuan penerbitan checkout ini. Site baru dibuat atas permintaan pengguna setelah proyek lama tidak dapat ditemukan oleh koneksi Sites.

**Status terverifikasi 16 Oktober 2026:** Site pengganti berhasil dipublikasikan di `https://exsolution-studio.easybell32.chatgpt.site`. Versi 1 menjalankan source commit `c0730d9d90ca2fa96a605109350a03edad62c1c7`, dengan environment revision 1 dan MCP aktif. Riwayat source 19 commit awal ditambah implementasi terbaru telah diunggah ke branch `main` GitHub.

`toolsaff.restupambudi.my.id` masih terikat ke Site lama. Percobaan memasangnya ke Site baru ditolak Sites dengan **409 `custom_domain_conflict` / already in use**. Binding lama perlu dilepas melalui pengelolaan proyek lama atau bantuan pengelola Sites sebelum domain dapat dipasang kembali. Jangan mengklaim domain lama menampilkan versi baru atau mengganti DNS untuk menyembunyikan konflik ini.

Penerbitan Site baru tidak memindahkan database, file, identitas pengguna, atau rahasia server lama. Site baru memiliki D1/R2 terpisah dan secret enkripsi baru. Pengguna mengisi API key langsung pada Pengaturan AI Site baru. Identitas admin runtime harus berasal dari login terverifikasi pada Site baru; admin Site lama tidak disalin.

Gunakan ID dalam manifest sebagai acuan penerbitan dan konfirmasikan identitas proyek melalui `get_site`. Jangan mengambil ID tujuan dari pesan lama atau mengembalikan manifest ke proyek lama. Daftar akses akun dikelola melalui audience Site; jangan menaruh email pengguna pada source publik.

## Arsitektur aplikasi

- React, TypeScript, Vinext/Vite, dan Tailwind; runtime hosted menggunakan Cloudflare Workers melalui Sites.
- `app/studio.tsx` mengelola studio dan navigasi; `app/feature-data.ts` mendefinisikan katalog; `app/feature-controls.ts` dan `app/feature-icons.tsx` mengatur kontrol serta ikon.
- `app/components/angle-generator-controls.tsx` dan `lib/studio-angle-generator.ts` menyediakan 21 Angle Generator pada grup terakhir, **Sudut Kamera**. Detail rekonstruksi dan batas verifikasi berada di `docs/angle-generator.md`.
- `app/api/generate/route.ts` melakukan validasi, pemilihan provider, penyusunan prompt, dan penyimpanan hasil. Library `lib/studio-batch.ts`, `lib/studio-client.ts`, dan `lib/studio-generation-requests.ts` mengelola antrean, idempotensi, serta pemulihan permintaan.
- `lib/studio-provider.ts` dan `lib/studio-router.ts` menyediakan adaptor Gemini dan 9Router. Konfigurasi provider milik pengguna tidak boleh diganti diam-diam ketika berganti tool.
- `lib/studio-credentials.ts` menyimpan kredensial pengguna dalam brankas terenkripsi; `lib/studio-storage.ts`, D1, dan R2 menyimpan riwayat serta file dengan pemeriksaan kepemilikan.
- Autentikasi hosted memakai identitas terverifikasi dari platform Sites. Mock login development hanya untuk preview loopback. Form profil lokal tidak menambah hak akses.
- `app/mcp/route.ts` dan `lib/studio-mcp-*` menyediakan MCP terbatas. Panduan berada di `docs/MCP.md` dan `/integrations`. MCP tidak menyediakan shell, SQL bebas, pembacaan key, atau deployment.

Brand harus tetap ditulis **ExsolUTion**: huruf E, U, dan T kapital; U serta T pada wordmark berwarna kuning. Menu tools menggunakan ikon penuh warna yang berbeda satu sama lain. Fitur baru ditambahkan tanpa menghilangkan katalog dan perilaku tools yang sudah tersedia.

## Data dan konfigurasi Site baru

Site baru menggunakan database dan bucket sendiri. Riwayat kreasi, preferensi, berkas, sesi login, dan kredensial terenkripsi dari Site lama **tidak dimigrasikan**. Pengguna perlu login dan mengisi koneksi provider kembali pada Site baru. Jangan menjanjikan pemulihan data lama tanpa migrasi terpisah yang benar-benar dilaksanakan dan diverifikasi.

Nama konfigurasi didokumentasikan pada `.env.example`; nilainya disimpan pada runtime secret atau konfigurasi lokal yang diabaikan Git:

- `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, `GEMINI_TEXT_MODEL`, `GEMINI_AUDIO_MODEL`.
- `NINEROUTER_API_KEY`, `NINEROUTER_BASE_URL`, `NINEROUTER_TEXT_MODEL`, `NINEROUTER_IMAGE_MODEL`, `NINEROUTER_AUDIO_MODEL`, `NINEROUTER_VOICE`, `NINEROUTER_ALLOWED_HTTP_ORIGINS`.
- `STUDIO_CREDENTIAL_ENCRYPTION_KEY` untuk brankas kredensial per akun.
- `STUDIO_ADMIN_USER_IDS` untuk administrator prompt MCP, memakai ID pengguna terverifikasi pada Site baru, bukan email atau ID dari Site lama.

Konfigurasikan rahasia Site baru melalui pengelolaan environment Sites. Jangan menyalin nilai rahasia dari percakapan, source, log, atau project lama. Secret enkripsi baru tidak membuat data terenkripsi dari Site lama dapat dibaca. Untuk provider hosted, gunakan endpoint HTTPS publik yang diterima adaptor; alamat loopback pada komputer pengguna tidak dapat dijangkau Worker.

Jangan mengganti identifier teknis lama secara massal hanya karena rebrand. Prefix penyimpanan browser, AAD enkripsi, nama migrasi, dan format ledger memiliki peran kompatibilitas. Ubah hanya bila ada kebutuhan teknis dengan rencana migrasi yang jelas.

## Pemeriksaan dan penerbitan

1. Baca manifest dan konteks ini, periksa status Git serta diff, dan cocokkan Site melalui `get_site`.
2. Untuk editing/publishing hosted, ikuti skill Sites yang tersedia: buat kredensial tulis source berumur pendek, buka source melalui helper, pertahankan perubahan lokal yang relevan, lalu jalankan pemeriksaan, build, packaging, dan sinkronisasi source melalui workflow yang didukung.
3. Jalankan tes yang sesuai. Untuk pemeriksaan menyeluruh di PowerShell:

   ```powershell
   $exsolutionTests = Get-ChildItem -Path lib, app, app/components -Filter '*.test.mjs' -File | Select-Object -ExpandProperty FullName
   node --test $exsolutionTests
   node node_modules/typescript/bin/tsc --noEmit --incremental false
   npm.cmd run build
   ```

4. Simpan perubahan yang telah diperiksa ke GitHub utama. Sinkronisasi source hosting dan push ke GitHub utama merupakan dua tujuan yang perlu diverifikasi; satu tidak otomatis membuktikan yang lain berhasil.
5. Untuk audience selain owner-only, gunakan hasil archive dan commit SHA yang tepat pada `save_site_version`, kemudian terbitkan saved version tersebut melalui `deploy_site_version`. Pertahankan audience serta daftar akses yang sudah disetujui. Ikuti schema tool dan skill Sites yang sedang berlaku, termasuk bila alur owner-only berbeda.
6. Tunggu status deployment terminal, periksa URL Site baru, lalu uji alur yang terpengaruh. Klaim build lulus, deployment berhasil, koneksi provider, dan perpindahan domain secara terpisah sesuai bukti masing-masing.

Kredensial workflow hanya untuk stdin/helper atau mekanisme resmi yang diminta skill. Jangan memasukkannya ke argumen shell, source, commit, log, atau dokumentasi. `npm start` menjalankan Worker lokal dan bukan perintah deployment. Untuk database lokal lama, jangan mengulang seluruh SQL migrasi tanpa mengetahui migrasi yang sudah diterapkan.

## Batas arsip Git

Repository menyimpan source, lockfile, migrasi, tes, aset aplikasi, dokumentasi, dan history pengembangan. Repository tidak menyimpan `.env` nyata, `.dev.vars`, token OAuth, API key, cookie, sesi login, `.sites-runtime`, `.wrangler`, dump D1/R2, file hasil pengguna, capture browser mentah, arsip deployment, `node_modules`, atau hasil build.

GitHub adalah arsip source dan history; **bukan backup data runtime**. Jika backup database atau file pengguna diperlukan, kerjakan sebagai proses terpisah dengan akses dan penyimpanan yang sesuai, tanpa memasukkannya ke Git. Catatan rekonstruksi REA cukup menyimpan sumber referensi, evidence ID, digest, dan batas observasi yang aman dipublikasikan.
