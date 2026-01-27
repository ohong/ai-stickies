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
    <section id="faq" className="py-16 md:py-24 bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#09C754] font-bold text-xs md:text-sm uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
            FAQ
          </span>
          <h2 className="mt-4 md:mt-6 text-2xl md:text-5xl font-black text-foreground text-balance">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <button
                id={`faq-question-${i}`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full py-4 md:py-6 px-4 md:px-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="font-bold text-sm md:text-lg text-foreground pr-4 md:pr-8">
                  {faq.question}
                </span>
                <div
                  aria-hidden="true"
                  className={cn(
                    "size-7 md:size-8 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 transition-[background-color,border-color,color] duration-200",
                    openIndex === i && "bg-[#09C754] border-[#09C754] text-white"
                  )}
                >
                  <svg
                    className={cn(
                      "size-3.5 md:size-4 transition-transform duration-200",
                      openIndex === i ? "transform rotate-180" : "text-gray-400"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={cn(
                  "px-4 md:px-6 grid transition-[grid-template-rows,padding,opacity] duration-300 ease-in-out",
                  openIndex === i ? "grid-rows-[1fr] pb-4 md:pb-6 opacity-100" : "grid-rows-[0fr] pb-0 opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="text-muted-foreground leading-relaxed text-pretty text-sm md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
