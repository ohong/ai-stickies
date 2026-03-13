import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Sticker Pack",
  description:
    "Upload your photo and create a personalized LINE sticker pack with AI. Choose from 5 unique artistic styles.",
  robots: { index: false },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
