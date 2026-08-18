import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hymecymeyseh Media | Your Private Cinema",
  description: "A private, beautifully arranged Jellyfin media library.",
  applicationName: "Hymecymeyseh Media",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0a0a0a", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
