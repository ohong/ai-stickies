import Link from "next/link";
import Image from "next/image";

// Define sticker data for better management and randomization
// Divided into 3 Phases (approx 7 stickers each) to reduce crowding
// Cycle time: 12s. Phase 1: ~0s, Phase 2: ~4s, Phase 3: ~8s
const stickers = [
  // --- PHASE 1 (Starts ~0s) ---
  {
    id: 1,
    label: "Chibi Girl",
    top: "15%",
    left: "5%",
    rotate: "-15deg",
    cycleDelay: "0s",
    size: "w-32 h-32 lg:w-40 lg:h-40",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/chibi/01.png"
          alt="Chibi Girl Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>
    )
  },
  {
    id: 5,
    label: "Minimalist Hore",
    top: "70%",
    left: "2%",
    rotate: "-28deg",
    cycleDelay: "0.2s",
    size: "w-44 h-44 lg:w-60 lg:h-60",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/minimalist/01.png"
          alt="Minimalist Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 176px, 240px"
        />
      </div>
    )
  },
  {
    id: 8,
    label: "High Fidelity Dog",
    top: "15%",
    right: "5%",
    rotate: "18deg",
    cycleDelay: "0.4s",
    size: "w-28 h-28 lg:w-36 lg:h-36",
    content: (
      <div className="relative w-full h-full drop-shadow-sm transition-transform hover:scale-110">
        <Image
          src="/stickers/high-fidelity/01.png"
          alt="High Fidelity Dog Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 112px, 144px"
        />
      </div>
    )
  },
  {
    id: 12,
    label: "Abstract Idea",
    bottom: "15%",
    right: "8%",
    rotate: "32deg",
    cycleDelay: "0.6s",
    size: "w-24 h-24 lg:w-28 lg:h-28",
    content: (
      <div className="relative w-full h-full drop-shadow-sm transition-transform hover:scale-110">
        <Image
          src="/stickers/abstract/04.png"
          alt="Abstract Idea Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 96px, 112px"
        />
      </div>
    )
  },
  {
    id: 21,
    label: "Minimalist Retro",
    top: "18%",
    left: "22%",
    rotate: "12deg",
    cycleDelay: "0.8s",
    size: "w-28 h-28 lg:w-36 lg:h-36",
    content: (
      <div className="relative w-full h-full drop-shadow-sm transition-transform hover:scale-110">
        <Image
          src="/stickers/minimalist/03.png"
          alt="Minimalist Retro Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 112px, 144px"
        />
      </div>
    )
  },
  {
    id: 22,
    label: "Abstract Cat",
    bottom: "5%",
    right: "10%",
    rotate: "-10deg",
    cycleDelay: "1.0s",
    size: "w-32 h-32 lg:w-40 lg:h-40",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/abstract/08.png"
          alt="Abstract Cat Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>
    )
  },

  // --- PHASE 2 (Starts ~4s) ---
  {
    id: 4,
    label: "Minimalist Frog",
    bottom: "12%",
    left: "5%",
    rotate: "15deg",
    cycleDelay: "4.0s",
    size: "w-40 h-40 lg:w-52 lg:h-52",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/minimalist/05.png"
          alt="Minimalist Frog Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 160px, 208px"
        />
      </div>
    )
  },
  {
    id: 18,
    label: "Abstract Glitch",
    top: "15%",
    right: "2%",
    rotate: "-22deg",
    cycleDelay: "4.2s",
    size: "w-36 h-36 lg:w-44 lg:h-44",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/abstract/06.png"
          alt="Abstract Glitch Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 144px, 176px"
        />
      </div>
    )
  },
  {
    id: 2,
    label: "High Fidelity Bear",
    top: "18%",
    right: "18%",
    rotate: "-25deg",
    cycleDelay: "4.4s",
    size: "w-32 h-32 lg:w-40 lg:h-40",
    content: (
      <div className="relative w-full h-full drop-shadow-lg transition-transform hover:scale-110">
        <Image
          src="/stickers/high-fidelity/03.png"
          alt="High Fidelity Bear Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>
    )
  },
  {
    id: 10,
    label: "Chibi Cool",
    bottom: "20%",
    left: "15%",
    rotate: "-12deg",
    cycleDelay: "4.6s",
    size: "w-36 h-36 lg:w-48 lg:h-48",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/chibi/03.png"
          alt="Chibi Cool Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 144px, 192px"
        />
      </div>
    )
  },
  {
    id: 23,
    label: "Chibi Sketch",
    top: "15%",
    left: "10%",
    rotate: "8deg",
    cycleDelay: "4.8s",
    size: "w-24 h-24 lg:w-32 lg:h-32",
    content: (
      <div className="relative w-full h-full drop-shadow-sm transition-transform hover:scale-110">
        <Image
          src="/stickers/chibi/05.png"
          alt="Chibi Sketch Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 96px, 128px"
        />
      </div>
    )
  },
  {
    id: 24,
    label: "High Fidelity 3D",
    bottom: "15%",
    right: "5%",
    rotate: "20deg",
    cycleDelay: "5.0s",
    size: "w-32 h-32 lg:w-40 lg:h-40",
    content: (
      <div className="relative w-full h-full drop-shadow-lg transition-transform hover:scale-110">
        <Image
          src="/stickers/high-fidelity/05.png"
          alt="High Fidelity 3D Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 128px, 160px"
        />
      </div>
    )
  },

  // --- PHASE 3 (Starts ~8s) ---
  {
    id: 6,
    label: "Chibi Pray",
    top: "20%",
    left: "15%",
    rotate: "-15deg",
    cycleDelay: "8.0s",
    size: "w-48 h-48 lg:w-64 lg:h-64",
    content: (
      <div className="relative w-full h-full drop-shadow-lg transition-transform hover:scale-110">
        <Image
          src="/stickers/chibi/07.png"
          alt="Chibi Pray Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 192px, 256px"
        />
      </div>
    )
  },
  {
    id: 9,
    label: "High Fidelity Love",
    bottom: "25%",
    right: "15%",
    rotate: "-20deg",
    cycleDelay: "8.2s",
    size: "w-36 h-36 lg:w-48 lg:h-48",
    content: (
      <div className="relative w-full h-full drop-shadow-xl transition-transform hover:scale-110">
        <Image
          src="/stickers/high-fidelity/07.png"
          alt="High Fidelity Love Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 144px, 192px"
        />
      </div>
    )
  },
  {
    id: 11,
    label: "Minimalist Star",
    top: "16%",
    right: "22%",
    rotate: "42deg",
    cycleDelay: "8.4s",
    size: "w-20 h-20 lg:w-24 lg:h-24",
    content: (
      <div className="relative w-full h-full drop-shadow-sm transition-transform hover:scale-110">
        <Image
          src="/stickers/minimalist/07.png"
          alt="Minimalist Star Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 80px, 96px"
        />
      </div>
    )
  },
  {
    id: 3,
    label: "Abstract Art",
    bottom: "5%",
    left: "25%",
    rotate: "25deg",
    cycleDelay: "8.6s",
    size: "w-40 h-40 lg:w-52 lg:h-52",
    content: (
      <div className="relative w-full h-full drop-shadow-lg transition-transform hover:scale-110">
        <Image
          src="/stickers/abstract/02.png"
          alt="Abstract Art Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 160px, 208px"
        />
      </div>
    )
  },
  {
    id: 25,
    label: "Minimalist Neon",
    top: "75%",
    left: "2%",
    rotate: "-5deg",
    cycleDelay: "8.8s",
    size: "w-32 h-32 lg:w-44 lg:h-44",
    content: (
      <div className="relative w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform hover:scale-110">
        <Image
          src="/stickers/minimalist/09.png"
          alt="Minimalist Neon Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 128px, 176px"
        />
      </div>
    )
  },
  {
    id: 26,
    label: "Abstract Anime",
    top: "80%",
    right: "2%",
    rotate: "15deg",
    cycleDelay: "9.0s",
    size: "w-28 h-28 lg:w-36 lg:h-36",
    content: (
      <div className="relative w-full h-full drop-shadow-md transition-transform hover:scale-110">
        <Image
          src="/stickers/abstract/10.png"
          alt="Abstract Anime Sticker"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 112px, 144px"
        />
      </div>
    )
  }
];

export function Hero() {
  return (
    <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-white pt-24 md:pt-32">
      {/* Background decoration - subtle clouds/blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gray-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-green-50 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Floating Stickers */}
      <div className="absolute inset-0 pointer-events-none select-none hidden md:block">
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className="absolute animate-pop-cycle opacity-0" // Start hidden, animation controls opacity
            style={{
              top: sticker.top,
              left: sticker.left,
              right: sticker.right,
              bottom: sticker.bottom,
              animationDelay: sticker.cycleDelay, // Staggered start times for the cycle
            }}
          >
            {/* Inner div for rotation only - removed float animation */}
            <div 
              className={`${sticker.size}`}
              style={{
                transform: `rotate(${sticker.rotate})`,
              }}
            >
              {sticker.content}
            </div>
          </div>
        ))}
      </div>

      {/* Main content - No entrance animation as requested */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 flex flex-col items-center justify-center">
        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all">
          <span className="text-xs md:text-sm font-bold text-foreground">
            Stickers, Emoji, and Themes
          </span>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-t-[6px] border-t-black border-r-[5px] border-r-transparent absolute -bottom-[6px] left-1/2 -translate-x-1/2"></div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1.1] tracking-tight text-balance mb-5 drop-shadow-sm">
          Create
          <br />
          <span className="text-[#09C754]">One-of-a-Kind</span>
          <br />
          Items
        </h1>

        {/* Subtitle */}
        <p className="mt-1 text-base md:text-xl text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed font-medium">
          Turn your selfie into a pack of personalized LINE stickers with AI.
          <br className="hidden md:block" />
          No drawing skills required.
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 bg-[#00B900] hover:bg-[#00A000] text-white font-bold text-base md:text-lg px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 min-w-[240px]"
          >
            Register here
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
          <span className="text-xs text-gray-400 font-medium">
            Takes less than 2 minutes
          </span>
        </div>
      </div>
    </section>
  );
}
