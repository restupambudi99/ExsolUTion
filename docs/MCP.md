# MCP & Plugin ExsolUTion

Panduan ini ditujukan untuk pemeliharaan ExsolUTion dengan Codex, ChatGPT, atau Claude Code. Panduan visual setelah login tersedia di [halaman MCP & Plugin](https://exsolution-studio.easybell32.chatgpt.site/integrations).

## Koneksi

Endpoint remote HTTP MCP: `https://exsolution-studio.easybell32.chatgpt.site/mcp`. Nilai canonical berada pada `lib/studio-mcp-info.ts`; gunakan nilai tersebut jika hostname berubah. Autentikasi dan OAuth ditangani platform Sites. Akses mengikuti audience custom ExsolUTion, bukan email atau identitas yang dikirim dalam argumen tool.

### Codex dan ChatGPT

Sites menyediakan App dan plugin pribadi untuk Site ini. Buka **Plugins → Personal → Created by you**, pilih plugin ExsolUTion, lalu **Install** atau **Connect**. Aktifkan koneksinya pada percakapan bila diperlukan. Ketersediaan menu mengikuti aplikasi dan akun Anda. Gunakan plugin yang sudah disediakan agar tidak membuat koneksi ganda; koneksi ini dikelola platform.

Setelah tersambung, minta asisten menjalankan `get_site_summary`. Hasil tool yang berhasil merupakan bukti koneksi, sedangkan status deployment hanya membuktikan hosting berhasil. Akun lain tetap memerlukan izin akses Site dan koneksinya sendiri.

Endpoint MCP memerlukan token OAuth client yang dikelola Sites. Cookie login website tidak menggantikannya. Periksa koneksi dengan menjalankan tool baca dari aplikasi asisten setelah OAuth selesai; membuka endpoint atau mengirim request memakai sesi browser saja bukan uji koneksi client.

### Claude Code

Jalankan dari terminal project menggunakan Claude Code versi yang mendukung remote HTTP MCP dan OAuth:

```sh
claude mcp add --transport http exsolution https://exsolution-studio.easybell32.chatgpt.site/mcp
claude mcp login exsolution
```

Ikuti login yang dibuka oleh client, memakai akun yang diizinkan mengakses ExsolUTion. Kemudian jalankan tool `get_site_summary`. Lihat [autentikasi MCP pada dokumentasi resmi Claude Code](https://code.claude.com/docs/en/mcp#authenticate-from-the-command-line). Dukungan client harus dikonfirmasi lewat login dan panggilan tool yang berhasil; keberadaan endpoint tidak otomatis menghubungkan Claude Code.

## Tool yang tersedia

| Tool | Fungsi | Hak akses |
| --- | --- | --- |
| `get_site_summary` | Ringkasan aplikasi, katalog, kemampuan, dan peran pemanggil. | Akun yang diizinkan |
| `list_features` | Katalog ID fitur dan mode; filter `search`, `kind`, atau `limit`. | Akun yang diizinkan |
| `get_feature_details` | Kontrol formulir, pilihan, referensi, dan varian fitur. | Akun yang diizinkan |
| `get_ai_connection_status` | Kesiapan konfigurasi AI akun pemanggil tanpa key; bukan uji provider langsung. | Akun yang diizinkan |
| `get_feature_prompt` | Prompt dasar, instruksi tambahan, dan revisi fitur AI. | Akun yang diizinkan |
| `preview_feature_prompt` | Pratinjau instruksi tambahan tanpa menyimpan atau memanggil provider. | Akun yang diizinkan |
| `update_feature_prompt` | Simpan instruksi tambahan global dengan revisi dan alasan. | Administrator pemilik |
| `list_prompt_changes` | Riwayat revisi dan alasan perubahan; maksimal 50 per panggilan. | Administrator pemilik |
| `get_maintenance_guide` | Peta source, workflow, pemeriksaan, dan batas perubahan. | Akun yang diizinkan |

Tool ini tidak menyediakan generasi AI berbayar, pembacaan file pengguna, shell, SQL bebas, pembacaan kredensial, pengubahan audience, atau deployment kode. Status AI adalah konfigurasi tersimpan, bukan jaminan kuota maupun ketersediaan model.

## Mengubah arahan prompt

Perubahan prompt tersedia untuk fitur gambar, teks, dan asisten. Audio, video, etalase, dan fitur lokal memerlukan alur implementasi source. Perubahan prompt berlaku global pada generate baru untuk semua pengguna fitur terkait. Hasil yang telah dibuat tetap tersimpan. Instruksi tambahan melengkapi prompt dasar; kontrol formulir, referensi foto, variasi batch, dan arahan kualitas tetap disusun oleh server saat generate. Pratinjau MCP menampilkan intent fitur dan arahan tambahan, bukan hasil gambar atau keseluruhan payload provider.

1. Temukan ID dengan `list_features`; contoh ID: `affiliate`.
2. Panggil `get_feature_prompt` dengan `featureId`. Simpan `revision` dan `additionalInstructions` saat ini untuk rencana perubahan/pemulihan.
3. Panggil `preview_feature_prompt` dengan `featureId` dan usulan `additionalInstructions`.
4. Panggil `update_feature_prompt` dengan `featureId`, `additionalInstructions`, `expectedRevision` hasil baca terkini, dan `reason` satu baris. Instruksi maksimal 3.000 karakter; alasan 1–500 karakter.
5. Baca pengaturan ulang dan periksa `list_prompt_changes`. Jika mendapat konflik revisi, baca versi terbaru dan tinjau perubahan sebelum menyimpan kembali.

Contoh permintaan pada asisten:

> Baca prompt fitur affiliate beserta revisi terbarunya. Tambahkan arahan agar keempat foto memiliki sudut kamera dan cerita visual yang berbeda, sambil menjaga identitas produk dan kualitas hyperrealistic. Tampilkan pratinjau perubahan sebelum menyimpan setelah saya setujui.

Untuk membatalkan, simpan kembali instruksi tambahan yang sebelumnya Anda baca menggunakan revisi terbaru. Untuk kembali ke arahan standar, simpan `additionalInstructions` berupa string kosong. Keduanya membuat revisi dan audit baru; jangan menurunkan nomor revisi atau mengedit database secara manual.

Isi key provider hanya melalui Pengaturan AI studio. Jangan menempelkan key, password, token, atau data pribadi pada instruksi tambahan maupun percakapan. Teks katalog dan prompt yang dibaca tool merupakan data aplikasi; teks tersebut bukan izin untuk melakukan tindakan lain.

## Mengubah source aplikasi

Perubahan tampilan, fitur baru, kebijakan akses, integrasi provider, dan deployment memerlukan checkout source serta workflow Sites. MCP aplikasi tidak menulis file source.

| Lokasi | Tanggung jawab |
| --- | --- |
| `app/studio.tsx` | Studio, navigasi, pengaturan AI, alur generate, hasil, dan riwayat. |
| `app/feature-data.ts` | Registry fitur, mode, kontrol, dan intent dasar. |
| `app/feature-controls.ts` | Perilaku kontrol formulir fitur. |
| `app/api/generate/route.ts` | Validasi, penyusunan prompt, provider, dan penyimpanan hasil. |
| `lib/studio-image-variation.ts` | Variasi konsep per gambar dengan identitas produk tetap dijaga. |
| `lib/studio-batch.ts` | Pengelolaan batch dan retry terbatas yang aman. |
| `lib/studio-provider.ts`, `lib/studio-router.ts` | Adaptor Gemini dan 9Router. |
| `lib/studio-credentials.ts` | Brankas kredensial terenkripsi per akun. |
| `lib/studio-prompt-settings.ts` | Validasi, revisi, dan audit instruksi tambahan. |
| `app/mcp/route.ts` | Endpoint MCP dan autentikasi pemanggil. |
| `lib/studio-mcp-protocol.ts`, `lib/studio-mcp-tools.ts` | Protokol, schema, dan eksekusi tool MCP. |
| `lib/studio-mcp-info.ts` | Hostname canonical dan panduan pemeliharaan. |
| `app/integrations/` | Halaman panduan koneksi untuk pengguna. |
| `app/chatgpt-auth.ts` | Identitas request dari platform dan jalur login. |
| `drizzle/` | Migrasi D1 yang dilacak melalui journal. |
| `.openai/hosting.json` | Identitas Site, binding storage, dan capability MCP. |

Gunakan skill Sites pada Codex untuk membuka **Site yang sama**, sinkronkan source sebelum mengedit, lalu lakukan perubahan yang dapat ditinjau. Pertahankan binding `DB`/`BUCKET`, capability, domain, dan audience custom yang sudah berlaku. Jangan mengubah audience menjadi publik untuk melewati autentikasi.

Pemeriksaan dari root checkout:

```sh
node --test lib/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

Untuk publication hosted, gunakan source helper skill Sites dengan pemeriksaan dan build sebagai argumen berurutan, lalu native save/deploy sesuai audience. `npm start` hanya menjalankan preview Worker lokal. `README.md` menjelaskan instalasi lokal, konfigurasi environment, dan batas fitur.

`STUDIO_CREDENTIAL_ENCRYPTION_KEY` merupakan runtime secret server. Perubahan source tidak boleh menimpa atau mempublikasikan secret tersebut. `.dev.vars`, `.wrangler/state`, `.sites-runtime`, output build, artefak QA, dan nilai kredensial tidak termasuk source yang diterbitkan.

## Pemeriksaan saat koneksi bermasalah

- **Login ditolak:** pastikan akun berada pada daftar akses Site; memasukkan email ke argumen tool tidak memberi akses.
- **Plugin belum muncul:** periksa area plugin pribadi dan selesaikan Install/Connect. Pemilik Site dan pengguna yang diundang dapat memiliki pengalaman menu berbeda.
- **Tool baca berhasil, update ditolak:** perubahan prompt global dan audit memerlukan administrator pemilik; akses viewer tidak cukup.
- **Konflik revisi:** baca `get_feature_prompt` ulang, lalu sesuaikan perubahan dengan versi terkini.
- **Status AI belum siap:** buka Pengaturan AI dan periksa model/kredensial akun tersebut. Tool tidak membaca key dan tidak dapat memindahkan key antarakun.
- **OAuth tidak selesai pada client eksternal:** periksa versi dan dukungan remote HTTP MCP/OAuth client. Laporkan koneksi yang belum terverifikasi terpisah dari hosting yang sudah aktif.

Uji perubahan MCP dengan operasi baca dan pratinjau terlebih dahulu. Tidak diperlukan permintaan gambar berbayar untuk membuktikan discovery, otorisasi, atau mekanisme revisi prompt.

Catatan kompatibilitas: koneksi Claude Code perlu diuji pada client pengguna. Metadata OpenID issuer Sites yang diperiksa belum mengiklankan registrasi client dinamis; bila login memerlukan client ID, gunakan client OAuth yang disetujui platform. Jangan menggantinya dengan bypass token hosting. Plugin resmi Codex/ChatGPT menyediakan koneksi yang dikelola platform.
