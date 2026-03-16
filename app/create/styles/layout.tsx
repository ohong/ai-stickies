import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Your Style",
  description:
    "Browse and select from 5 AI-generated artistic styles for your personalized LINE sticker pack.",
  openGraph: {
    title: "Choose Your Style | AI Stickies",
    description:
      "Browse and select from 5 AI-generated artistic styles for your personalized LINE sticker pack.",
  },
};

export default function StylesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
