"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, Code2, Copy, FileCode2, Fingerprint, History, Layers3, LockKeyhole, MessageSquare, PlugZap, ShieldCheck, SlidersHorizontal, Sparkles, Terminal } from "lucide-react";
import { MCP_URL, SITE_URL } from "@/lib/studio-mcp-info";

const tools = [
  { name: "get_site_summary", description: "Baca ringkasan studio dan kemampuan integrasinya.", icon: Layers3 },
  { name: "list_features", description: "Temukan ID fitur dan mode yang tersedia.", icon: BookOpen },
  { name: "get_feature_details", description: "Periksa formulir, pilihan, dan kebutuhan referensi suatu fitur.", icon: SlidersHorizontal },
  { name: "get_ai_connection_status", description: "Lihat kesiapan konfigurasi provider akun Anda, tanpa membuka API key.", icon: ShieldCheck },
  { name: "get_feature_prompt", description: "Baca prompt dasar, instruksi tambahan, dan revisi terkini.", icon: FileCode2 },
  { name: "preview_feature_prompt", description: "Tinjau instruksi tambahan sebelum menyimpannya.", icon: Sparkles },
  { name: "update_feature_prompt", description: "Simpan instruksi tambahan dengan revisi dan alasan perubahan.", icon: SlidersHorizontal, owner: true },
  { name: "list_prompt_changes", description: "Periksa riwayat revisi dan alasan perubahan prompt.", icon: History, owner: true },
  { name: "get_maintenance_guide", description: "Temukan alur pengembangan, file penting, dan pemeriksaan source.", icon: Code2 },
];

const example = "Baca prompt fitur affiliate beserta revisi terbarunya. Tambahkan arahan agar keempat foto memiliki sudut kamera dan cerita visual yang berbeda, sambil menjaga identitas produk dan kualitas hyperrealistic. Tampilkan pratinjau perubahan sebelum menyimpan setelah saya setujui.";

function CopyBlock({ text, label, multiline = false }: { text: string; label: string; multiline?: boolean }) {
  const [feedback, setFeedback] = useState<{ message: string; copied: boolean } | null>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback({ message: `${label} berhasil disalin.`, copied: true });
    } catch {
      setFeedback({ message: "Salin otomatis belum tersedia. Pilih teks di bawah, lalu salin secara manual.", copied: false });
    }
  }
  return <div className="integration-copy">
    <div className="integration-copy-header"><span>{label}</span><button type="button" onClick={copy} aria-label={`Salin ${label.toLowerCase()}`}>{feedback?.copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}<span>{feedback?.copied ? "Tersalin" : "Salin"}</span></button></div>
    {multiline ? <pre tabIndex={0} aria-label={label}><code>{text}</code></pre> : <input aria-label={label} readOnly value={text} onFocus={event => event.currentTarget.select()} spellCheck={false} />}
    <p className={`integration-copy-feedback${feedback && !feedback.copied ? " integration-copy-failed" : ""}`} role="status" aria-live="polite">{feedback?.message || " "}</p>
  </div>;
}

export default function ConnectionGuide() {
  useEffect(() => {
    try {
      const theme = JSON.parse(localStorage.getItem("affgo.theme") || '"light"');
      if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
    } catch { /* The default studio theme stays usable when storage is unavailable. */ }
  }, []);

  return <main className="integrations-page">
    <a className="integration-skip" href="#connect">Langsung ke panduan koneksi</a>
    <header className="integration-header"><a className="integration-brand" href="/" aria-label="AFF GO, kembali ke studio"><span>AG</span><div><strong>AFF GO</strong><small>by AIMODE</small></div></a><a className="integration-back" href="/"><ArrowLeft size={17} aria-hidden="true" /> Kembali ke studio</a></header>

    <section className="integration-hero" aria-labelledby="integration-title">
      <div className="integration-eyebrow"><PlugZap size={15} aria-hidden="true" /> WORKSPACE INTEGRATIONS</div>
      <h1 id="integration-title">MCP &amp; Plugin</h1>
      <p>Rawat AFF GO lewat asisten AI Anda. Pahami fitur, periksa koneksi, dan sesuaikan arahan prompt dari satu koneksi.</p>
      <div className="integration-access"><ShieldCheck size={17} aria-hidden="true" /><span>Akses mengikuti akun dan daftar email yang diizinkan di AFF GO.</span></div>
    </section>

    <section className="integration-endpoint" aria-labelledby="endpoint-title">
      <div className="integration-section-intro"><span className="integration-section-icon"><PlugZap size={21} aria-hidden="true" /></span><div><h2 id="endpoint-title">Satu endpoint untuk studio Anda</h2><p>HTTP MCP dengan autentikasi yang dikelola Sites.</p></div><span className="integration-label"><LockKeyhole size={13} aria-hidden="true" /> Memerlukan login</span></div>
      <CopyBlock text={MCP_URL} label="Endpoint MCP" />
      <p className="integration-footnote">Selesaikan OAuth di aplikasi pilihan, lalu minta asisten menjalankan <code>get_site_summary</code> untuk memeriksa koneksinya. Endpoint MCP memakai token OAuth tersendiri; sesi login website tidak menggantikan koneksi client.</p>
    </section>

    <section className="integration-section" id="connect" aria-labelledby="connect-title">
      <div className="integration-section-heading"><div><span className="integration-kicker">MULAI DI SINI</span><h2 id="connect-title">Pilih asisten Anda</h2></div><p>Gunakan akun yang memiliki akses ke AFF GO.</p></div>
      <div className="integration-clients">
        <article className="integration-client integration-client-codex"><span className="integration-client-icon"><Code2 size={25} aria-hidden="true" /></span><h3>Codex</h3><p>Gunakan plugin pribadi AFF GO yang disediakan Sites.</p><ol><li>Buka <strong>Plugins → Personal → Created by you</strong>.</li><li>Pilih plugin AFF GO, lalu <strong>Install</strong> atau <strong>Connect</strong>.</li><li>Selesaikan login dan jalankan contoh permintaan di bawah.</li></ol><div className="integration-client-note"><Fingerprint size={15} aria-hidden="true" /> Gunakan koneksi plugin yang dikelola platform.</div></article>
        <article className="integration-client integration-client-chatgpt"><span className="integration-client-icon"><MessageSquare size={25} aria-hidden="true" /></span><h3>ChatGPT</h3><p>Hubungkan plugin AFF GO melalui akses yang tersedia di akun Anda.</p><ol><li>Buka <strong>Plugins → Personal → Created by you</strong> pada permukaan yang menyediakan plugin pribadi.</li><li>Pilih AFF GO, lalu <strong>Install</strong> atau <strong>Connect</strong>.</li><li>Aktifkan koneksinya pada percakapan yang akan dipakai.</li></ol><div className="integration-client-note"><Fingerprint size={15} aria-hidden="true" /> Ketersediaan menu mengikuti akun dan aplikasi Anda.</div></article>
        <article className="integration-client integration-client-claude"><span className="integration-client-icon"><Terminal size={25} aria-hidden="true" /></span><h3>Claude Code</h3><p>Gunakan endpoint HTTP jarak jauh bila client OAuth Anda didukung Sites. Koneksi Claude Code belum diverifikasi pada instalasi ini.</p><CopyBlock text={`claude mcp add --transport http aff-go ${MCP_URL}\nclaude mcp login aff-go`} label="Perintah Claude Code" multiline /><p className="integration-claude-next">Ikuti alur login yang dibuka oleh client. Koneksi perlu dikonfirmasi melalui panggilan tool yang berhasil. <a href="https://code.claude.com/docs/en/mcp#authenticate-from-the-command-line" target="_blank" rel="noreferrer">Panduan resmi Claude Code <ArrowUpRight size={12} aria-hidden="true" /></a></p></article>
      </div>
    </section>

    <section className="integration-example" aria-labelledby="example-title"><div className="integration-section-heading"><div><span className="integration-kicker">COBA SATU PERMINTAAN</span><h2 id="example-title">Dari ide ke perubahan yang bisa ditinjau</h2></div><Sparkles size={25} aria-hidden="true" /></div><CopyBlock text={example} label="Contoh prompt untuk asisten" multiline /><div className="integration-flow"><span><BookOpen size={15} aria-hidden="true" /> Baca revisi</span><ChevronRight size={15} aria-hidden="true" /><span><Sparkles size={15} aria-hidden="true" /> Pratinjau</span><ChevronRight size={15} aria-hidden="true" /><span><CheckCircle2 size={15} aria-hidden="true" /> Simpan</span></div></section>

    <section className="integration-section" aria-labelledby="tools-title"><div className="integration-section-heading"><div><span className="integration-kicker">KEMAMPUAN MCP</span><h2 id="tools-title">Tool yang dapat digunakan asisten</h2></div><p>Generasi gambar tetap dilakukan di studio.</p></div><div className="integration-tools">{tools.map(tool => <article key={tool.name}><tool.icon size={20} aria-hidden="true" /><div><h3><code>{tool.name}</code>{tool.owner && <span className="integration-owner-badge">Pemilik</span>}</h3><p>{tool.description}</p></div></article>)}</div></section>

    <section className="integration-details" aria-label="Bantuan dan batas perubahan">
      <details><summary><span><ShieldCheck size={20} aria-hidden="true" /> Bagaimana akses dan API key dilindungi?</span></summary><div><p>Setiap panggilan yang memuat data memerlukan identitas pengguna yang terautentikasi. Mengubah prompt bersama dan membaca riwayat perubahannya hanya tersedia bagi pemilik. Pengguna lain yang diizinkan tetap memakai akses sesuai perannya.</p><p>Tool menampilkan status konfigurasi AI, tanpa menampilkan API key. Isi key hanya di Pengaturan AI studio. Jangan menempelkan key, password, atau token ke percakapan.</p></div></details>
      <details><summary><span><History size={20} aria-hidden="true" /> Bagaimana perubahan prompt disimpan dan dibatalkan?</span></summary><div><p>Asisten perlu membaca prompt dan revisi terkini, meninjau instruksi tambahan, lalu menyimpan dengan revisi yang sama dan alasan perubahan. Jika prompt telah diubah oleh proses lain, baca ulang sebelum menyimpan.</p><p>Perubahan prompt tersedia untuk gambar, teks, dan asisten. Audio, video, dan fitur lokal memerlukan alur implementasi source.</p><p>Instruksi tambahan berlaku pada generate berikutnya untuk seluruh pengguna fitur terkait. Prompt dasar, arahan kualitas foto, dan variasi batch tetap berlaku. Untuk kembali ke arahan standar, simpan instruksi tambahan kosong menggunakan revisi terbaru; tindakan ini juga membuat revisi dan catatan perubahan.</p></div></details>
      <details><summary><span><FileCode2 size={20} aria-hidden="true" /> Bagaimana jika ingin mengubah tampilan atau menambah fitur?</span></summary><div><p>Gunakan checkout source AFF GO melalui workflow Sites di Codex atau lingkungan pengembangan Anda. MCP ini menyediakan perawatan prompt dan informasi aplikasi; perubahan tata letak, kode, dependensi, autentikasi, dan deployment dilakukan melalui source yang ditinjau dan diuji.</p><p>Minta asisten membaca <code>get_maintenance_guide</code> sebelum bekerja. Panduan lengkap pengembangan tersedia pada <code>README.md</code> dan <code>docs/MCP.md</code> di source project.</p></div></details>
      <details><summary><span><PlugZap size={20} aria-hidden="true" /> Apa yang perlu diperiksa jika koneksi belum berhasil?</span></summary><div><p>Pastikan akun yang dipakai tercantum pada daftar akses AFF GO. Coba buka studio terlebih dahulu, lalu ulangi Connect atau autentikasi di asisten. Pada plugin pribadi, gunakan koneksi yang sudah ada agar tidak membuat koneksi ganda.</p><p>Jika tool meminta revisi terbaru, baca ulang pengaturan prompt. Jika client tidak dapat menyelesaikan OAuth, periksa dukungan remote HTTP MCP pada versi client tersebut. Pesan berhasil menyalin endpoint hanya berarti alamatnya telah masuk clipboard.</p></div></details>
    </section>

    <footer className="integration-footer"><span>AFF GO <span aria-hidden="true">·</span> by AIMODE</span><a href={SITE_URL}>Buka studio <ArrowUpRight size={15} aria-hidden="true" /></a></footer>
  </main>;
}
