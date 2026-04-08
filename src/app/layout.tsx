import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TabBar from "./components/TabBar";
import GalleryPreloader from "./components/GalleryPreloader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CBAP Lodge Designer",
  description:
    "Design and share MBCI color combinations for your lodge — roof, walls, and trim",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* Kick off the gallery fetch on first page load so the
            Gallery tab has data ready by the time it's clicked. */}
        <GalleryPreloader />

        {/* Tiny brand strip above the tabs */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 text-xs text-gray-400 tracking-wide uppercase">
            CBAP Lodge Designer
          </div>
        </div>

        {/* Tab header — the two large segments split the header in two */}
        <header className="bg-white shadow-sm">
          <TabBar />
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gray-50">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
            CBAP Lodge Designer — Select and share building color combinations
          </div>
        </footer>
      </body>
    </html>
  );
}
