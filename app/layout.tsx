import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "GoKAnI AI - Image Generator",
  description: "Generate amazing images with GoKAnI AI (Flux). A powerful AI image generation tool powered by Replicate.",
  keywords: ["AI", "Image Generator", "Flux", "Replicate", "GoKAnI", "Art"],
  authors: [{ name: "GoKAnI Team" }],
  openGraph: {
    title: "GoKAnI AI - Image Generator",
    description: "Generate amazing images with GoKAnI AI (Flux)",
    siteName: "GoKAnI AI",
    images: [
      {
        url: "/gokanix1200x630.png",
        width: 1200,
        height: 630,
        alt: "GoKAnI AI Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoKAnI AI - Image Generator",
    description: "Generate amazing images with GoKAnI AI (Flux)",
    images: ["/gokanix1200x630.png"],
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
        className={`${openSans.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
