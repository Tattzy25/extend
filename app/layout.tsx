import type { Metadata } from "next";
import { Open_Sans, Orbitron } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "TaTTTy - AI Tattoo Image Generator",
  description: "Generate tattoo designs with TaTTTy.com. AI-powered tattoo visualization powered by Replicate.",
  keywords: ["AI", "Tattoo", "Image Generator", "Flux", "Replicate", "TaTTTy", "Art"],
  authors: [{ name: "TaTTTy.com" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  alternates: {
    canonical: "https://widget.tattty.com",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "TaTTTy - AI Tattoo Image Generator",
    description: "Generate tattoo designs with TaTTTy.com",
    siteName: "TaTTTy.com",
    url: "https://widget.tattty.com",
    images: [
      {
        url: "/tattty-og.png",
        width: 1200,
        height: 630,
        alt: "TaTTTy.com Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaTTTy - AI Tattoo Image Generator",
    description: "Generate tattoo designs with TaTTTy.com",
    images: ["/tattty-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${orbitron.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
