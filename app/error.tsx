"use client";

export default function StudioError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="studio-error-page"><section className="card"><h1>Studio belum dapat ditampilkan</h1><p>Terjadi gangguan pada tampilan aplikasi. Hasil yang sudah tersimpan tetap dapat dibuka melalui Riwayat Kreasi.</p><p>Jika ada proses generate yang terputus, periksa statusnya setelah aplikasi terbuka sebelum membuat permintaan baru.</p><button className="primary-button" onClick={reset}>Buka studio kembali</button></section></main>;
}
