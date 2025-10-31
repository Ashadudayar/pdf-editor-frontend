import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDFDoor - Free Online PDF Editor",
  description: "Edit PDFs online for free. Find & replace text, merge, split, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4540417255595648"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
  className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
>
  <main className="flex-1">
    {children}
  </main>
  <Footer />
</body>
    </html>
  );
}