import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Sticker Pack",
  description:
    "View, download, and export your AI-generated LINE sticker packs.",
  openGraph: {
    title: "Your Sticker Pack | AI Stickies",
    description:
      "View, download, and export your AI-generated LINE sticker packs.",
  },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
