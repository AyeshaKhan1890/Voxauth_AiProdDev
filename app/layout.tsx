import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Awaazera — Hear what’s real",
    template: "%s · Awaazera",
  },
  description:
    "Multilingual voice authenticity and audio forensics—starting with Urdu.",
  applicationName: "Awaazera",
  keywords: [
    "voice authenticity",
    "deepfake detection",
    "Urdu AI",
    "audio forensics",
  ],
  openGraph: {
    title: "Awaazera — Hear what’s real",
    description:
      "Detect synthetic speech, understand the evidence, and act with confidence.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1792,
        height: 910,
        alt: "Awaazera — Hear what’s real",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Awaazera — Hear what’s real",
    description: "Multilingual voice authenticity, built for evidence.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scheme-dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
