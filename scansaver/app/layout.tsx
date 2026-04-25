import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ScanSaver – Compare MRI, CT & Ultrasound Prices Near You",
  description:
    "Compare nearby hospitals and imaging centers by price, distance, and insurance coverage before you book.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
