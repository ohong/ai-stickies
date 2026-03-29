import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Sticker Pack",
  description:
    "Upload a selfie, customize your style, and generate a pack of 10 unique LINE stickers with AI.",
  openGraph: {
    title: "Create Your Sticker Pack | AI Stickies",
    description:
      "Upload a selfie, customize your style, and generate a pack of 10 unique LINE stickers with AI.",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
