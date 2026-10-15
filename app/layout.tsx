import type { Metadata } from "next";
import { BRAND_DESCRIPTION, BRAND_NAME } from "@/lib/studio-brand";
import "./font.css";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — AI Creative Studio`,
  description: BRAND_DESCRIPTION,
  openGraph: {
    title: `${BRAND_NAME} — AI Creative Studio`,
    description: BRAND_DESCRIPTION,
    type: "website",
  },
  icons: {
    icon: "/favicon.svg?v=exsolution",
    shortcut: "/favicon.svg?v=exsolution",
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
