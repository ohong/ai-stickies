import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generation History",
  description:
    "View and re-download your previously generated AI sticker packs.",
  openGraph: {
    title: "Generation History | AI Stickies",
    description:
      "View and re-download your previously generated AI sticker packs.",
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
