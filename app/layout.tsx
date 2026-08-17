import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hymecymeyseh.com"),
  title: "Hymecymeyseh | A Private Visual Lounge",
  description: "A playful visual archive of moving images and memorable fragments. Adults only.",
  applicationName: "Hymecymeyseh",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Hymecymeyseh",
    title: "Hymecymeyseh",
    description: "We are here to just have fun.",
    images: [{ url: "/media/share.jpg", width: 1125, height: 1745, alt: "Hymecymeyseh visual artwork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hymecymeyseh",
    description: "We are here to just have fun.",
    images: ["/media/share.jpg"],
  },
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080914",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
