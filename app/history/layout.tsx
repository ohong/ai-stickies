import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generation History",
  description: "View your previous AI sticker pack generations.",
  robots: { index: false },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
