const features = [
  {
    step: "1",
    title: "Upload a Selfie",
    description:
      "Just one clear photo to get started. Our AI analyzes your unique features.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    step: "2",
    title: "Choose Your Style",
    description:
      "Pick from 5 artistic styles - chibi, minimalist, cartoon, and more.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
  {
    step: "3",
    title: "AI Generation",
    description:
      "Our AI creates 10 unique stickers with various expressions and poses.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    step: "4",
    title: "Download & Share",
    description:
      "Get LINE-ready stickers instantly. Use them or sell on LINE Creators Market.",
    icon: (
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="text-center mb-16">
        <span className="text-primary font-medium text-sm uppercase tracking-widest">
          How it works
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground text-balance">
          Create stickers in minutes
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-pretty">
          A simple 4-step process to turn your selfie into personalized stickers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {features.map((feature) => (
          <div key={feature.step} className="relative">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-4">
              <span className="size-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                {feature.step}
              </span>
              <div className="hidden lg:block flex-1 h-px bg-border last:hidden" />
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border h-full">
              {/* Icon */}
              <div className="size-12 rounded-xl bg-secondary text-foreground flex items-center justify-center mb-4">
                {feature.icon}
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
