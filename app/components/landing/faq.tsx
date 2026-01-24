"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How does it work?",
    answer:
      "Upload a clear selfie photo, choose your preferred art style, and our AI generates a pack of 10 unique stickers featuring your likeness. The entire process takes less than 2 minutes.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "You can upload photos in JPG, PNG, or HEIC format. We recommend using a well-lit, front-facing photo for the best results. Generated stickers come in PNG format with transparent backgrounds.",
  },
  {
    question: "Can I sell my stickers on LINE?",
    answer:
      "Yes. Your generated stickers are yours to use commercially. We provide the correct dimensions (370x320 pixels) and format required by LINE Creators Market.",
  },
  {
    question: "How many stickers do I get?",
    answer:
      "Each generation creates a pack of 10 unique stickers with different expressions and poses. You can generate additional packs with different styles.",
  },
  {
    question: "Is my photo stored?",
    answer:
      "We take privacy seriously. Your uploaded photo is processed immediately and automatically deleted from our servers within 24 hours.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="text-center mb-16">
        <span className="text-primary font-medium text-sm uppercase tracking-widest">
          FAQ
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground text-balance">
          Frequently asked questions
        </h2>
      </div>

      <div className="max-w-2xl mx-auto">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-border last:border-0">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              aria-expanded={openIndex === i}
            >
              <span className="font-medium text-foreground pr-4">
                {faq.question}
              </span>
              <div
                className={cn(
                  "size-6 rounded-full border border-border flex items-center justify-center shrink-0",
                  openIndex === i && "bg-primary border-primary"
                )}
              >
                <svg
                  className={cn(
                    "size-3",
                    openIndex === i ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={openIndex === i ? "M20 12H4" : "M12 4v16m8-8H4"}
                  />
                </svg>
              </div>
            </button>
            {openIndex === i && (
              <div className="pb-5">
                <p className="text-muted-foreground leading-relaxed text-pretty">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
