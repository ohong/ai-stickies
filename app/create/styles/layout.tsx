import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Your Style",
  description:
    "Pick from 5 AI-generated artistic styles for your LINE sticker pack.",
  robots: { index: false },
};

export default function StylesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
