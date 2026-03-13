import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Sticker Pack",
  description:
    "Download your AI-generated LINE sticker pack or export it for the LINE Creators Market.",
  robots: { index: false },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
