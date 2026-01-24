import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-16">
      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
          <span className="text-sm text-muted-foreground">
            Stickers, Emoji, and Themes
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight text-balance">
          Create
          <br />
          <span className="text-primary">One-of-a-Kind</span>
          <br />
          Stickers
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
          Turn your selfie into a pack of 10 personalized LINE stickers with AI.
          Express yourself like never before.
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Link
            href="/create"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 py-4 rounded-full shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span>Start Creating</span>
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* Social proof or trust indicator */}
        <p className="mt-8 text-sm text-muted-foreground">
          No account required. Start creating in seconds.
        </p>
      </div>
    </section>
  );
}
