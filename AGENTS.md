# Panduan agen ExsolUTion

- Selalu berkomunikasi dengan pengguna dalam bahasa Indonesia, kecuali diminta bahasa lain.
- Sebelum bekerja, baca `docs/PROJECT_CONTEXT.md`, `README.md`, dan `.openai/hosting.json`. Root repository ini adalah root aplikasi.
- Repository utama yang diminta pengguna: `https://github.com/restupambudi99/ExsolUTion.git`. Simpan perubahan implementasi yang relevan beserta history ke repository tersebut setelah diperiksa; jangan meminta tautan chat lama. Periksa remote dan status sebelum push; jangan force push atau menghapus history.
- Tujuan hosting berasal dari manifest aktif. Checkout lama `sites/affiliate-go` bukan source canonical. Gunakan workflow skill Sites untuk source, packaging, dan publishing; simpan kredensial berumur pendek hanya melalui mekanisme resmi.
- Brand tetap **ExsolUTion**, dengan E/U/T kapital serta U/T kuning. Pertahankan fitur, ikon tools penuh warna yang berbeda, autentikasi, pemeriksaan kepemilikan, dan isolasi kredensial pengguna.
- Jangan commit secret, email pengguna, state runtime, hasil generasi, dump database, capture browser mentah, atau arsip deployment. `.env.example` hanya memuat nama dan placeholder konfigurasi.
- Jangan mengganti prefix storage, AAD enkripsi, identifier migrasi, atau kontrak request hanya untuk rebrand.
- Jalankan tes yang relevan, TypeScript dengan `--incremental false`, dan build sebelum publikasi. Verifikasi deployment, provider, domain, dan data sebagai hasil yang terpisah; laporkan batas pengujian.
- Perbarui dokumentasi konteks saat keputusan hosting/domain/alur kerja berubah. Database dan bucket Site baru dimulai terpisah; jangan mengklaim migrasi data atau kredensial lama tanpa bukti.
