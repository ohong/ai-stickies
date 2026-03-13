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

const SITE_NAME = "AI Stickies";
const SITE_DESCRIPTION =
  "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes. Choose from 5 unique artistic styles and start expressing yourself!";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Make Your Own LINE Stickers`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://aistickies.com"),
  keywords: [
    "LINE stickers",
    "AI stickers",
    "custom stickers",
    "personalized stickers",
    "sticker maker",
    "LINE creator",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${SITE_NAME} - Make Your Own LINE Stickers`,
    description:
      "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes.",
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
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
    title: `${SITE_NAME} - Make Your Own LINE Stickers`,
    description:
      "Turn your selfie into a pack of 10 cute, personalized LINE stickers in minutes.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "theme-color": "#0CC755",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Agentation />
      </body>
    </html>
  );
}
