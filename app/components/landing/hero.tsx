import Link from "next/link";
import { FloatingStickers } from "./floating-stickers";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Floating stickers around the hero */}
      <FloatingStickers />

      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border shadow-sm mb-10">
          <span className="text-sm font-medium text-foreground">
            AI-Powered Sticker Creator
          </span>
        </div>

        {/* Main headline - bolder and more impactful */}
        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-foreground leading-[1.05] tracking-tight">
          Create
          <br />
          <span className="text-primary animate-subtle-pulse inline-block">
            One-of-a-Kind
          </span>
          <br />
          Stickers
        </h1>

        {/* Subtitle - clearer value prop */}
        <p className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
          Upload a selfie. Get 10 personalized LINE stickers.
          <span className="block mt-1 text-lg font-normal">Powered by AI. Ready in minutes.</span>
        </p>

        {/* CTA Button - larger and more prominent */}
        <div className="mt-12">
          <Link
            href="/create"
            className="group inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xl px-10 py-5 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <span>Start Creating</span>
            <svg
              className="size-6 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* Trust indicator */}
        <p className="mt-10 text-sm text-muted-foreground font-medium">
          No account needed. Free to try.
        </p>
      </div>

      {/* Decorative bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
