import { cn } from "@/lib/utils";

const features = [
  {
    step: "1",
    title: "Upload a Selfie",
    description:
      "Just one clear photo to get started. Our AI analyzes your unique features to create your character.",
    icon: (
      <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: "2",
    title: "Choose Your Style",
    description:
      "Pick from 5 artistic styles - from detailed cartoon portraits to cute chibi characters.",
    icon: (
      <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    step: "3",
    title: "AI Generation",
    description:
      "Our advanced AI creates 10 unique stickers with various expressions, poses, and emotions.",
    icon: (
      <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    step: "4",
    title: "Download & Share",
    description:
      "Get LINE-ready stickers instantly. Use them personally or sell on LINE Creators Market.",
    icon: (
      <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-[#06C755]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#06C755] font-bold text-xs md:text-sm uppercase tracking-widest bg-white px-3 py-1 rounded-full">
            Process
          </span>
          <h2 className="mt-4 md:mt-6 text-2xl md:text-5xl font-black text-white text-balance">
            Create stickers in minutes
          </h2>
          <p className="mt-3 md:mt-4 text-white/90 max-w-lg mx-auto text-sm md:text-lg px-2">
            A simple 4-step process to turn your selfie into personalized stickers
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <div key={feature.step} className="relative group">
              {/* Connector Line (Desktop) */}
              {index < features.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-[2px] bg-white/20 -z-10 group-hover:bg-white/50 transition-colors" />
              )}

              <div className="flex flex-col items-center text-center">
                {/* Step indicator */}
                <div className="size-12 md:size-16 rounded-xl md:rounded-2xl bg-white text-[#06C755] text-lg md:text-xl font-bold flex items-center justify-center shadow-sm mb-3 md:mb-6 group-hover:scale-110 transition-all duration-300 [&_svg]:size-6 md:[&_svg]:size-8">
                  {feature.icon}
                </div>

                <h3 className="text-base md:text-xl font-bold text-white mb-1.5 md:mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/80 leading-relaxed text-xs md:text-base">
                  {feature.description}
                </p>

                <span className="mt-2 md:mt-4 text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-wider">Step {feature.step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
