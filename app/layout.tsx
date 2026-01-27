import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Agentation } from "./agentation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Stickies - Make Your Own LINE Stickers",
  description:
    "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes. Choose from 5 unique artistic styles and start expressing yourself!",
  metadataBase: new URL("https://aistickies.com"),
  keywords: [
    "LINE stickers",
    "AI stickers",
    "custom stickers",
    "personalized stickers",
    "sticker maker",
    "LINE creator",
  ],
  openGraph: {
    title: "AI Stickies - Make Your Own LINE Stickers",
    description:
      "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Stickies - Create Personalized LINE Stickers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Stickies - Make Your Own LINE Stickers",
    description:
      "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes.",
    images: ["/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Agentation />
      </body>
    </html>
  );
}
