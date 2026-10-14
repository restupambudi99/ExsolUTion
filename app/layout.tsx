import type { Metadata } from "next";
import "./font.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affiliate GO — Photo Studio",
  description: "Studio foto, konten produk, desain, dan kreasi AI dalam satu workspace.",
  openGraph: {
    title: "Affiliate GO — Photo Studio",
    description: "Studio foto, konten produk, desain, dan kreasi AI dalam satu workspace.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
