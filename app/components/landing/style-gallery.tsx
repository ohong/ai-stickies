import Image from "next/image";

const styles = [
  {
    name: "High Fidelity",
    description: "Detailed cartoon portraits",
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    image: "/landing/styles/style-high-fidelity.png",
  },
  {
    name: "Stylized",
    description: "Cute blob characters",
    color: "bg-pink-50",
    borderColor: "border-pink-200",
    image: "/landing/styles/style-stylized.png",
  },
  {
    name: "Abstract",
    description: "Animal & object mashups",
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    image: "/landing/styles/style-abstract.png",
  },
  {
    name: "Chibi",
    description: "Big head, tiny body",
    color: "bg-yellow-50",
    borderColor: "border-yellow-200",
    image: "/landing/styles/style-chibi.png",
  },
  {
    name: "Minimalist",
    description: "Simple line art style",
    color: "bg-green-50",
    borderColor: "border-green-200",
    image: "/landing/styles/style-minimalist.png",
  },
];

export function StyleGallery() {
  return (
    <section id="styles" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#09C754] font-bold text-xs md:text-sm uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
            Art Styles
          </span>
          <h2 className="mt-4 md:mt-6 text-2xl md:text-5xl font-black text-foreground text-balance">
            5 unique styles to choose from
          </h2>
          <p className="mt-3 md:mt-4 text-muted-foreground max-w-lg mx-auto text-sm md:text-lg px-2">
            Each style brings out a different personality. Pick one that matches yours.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          {styles.map((style, index) => (
            <div key={style.name} className={`group cursor-pointer ${index === 4 ? 'col-span-2 md:col-span-1 max-w-[50%] mx-auto md:max-w-none' : ''}`}>
              <div className={`aspect-[4/5] rounded-xl md:rounded-2xl ${style.color} border-2 ${style.borderColor} flex flex-col items-center justify-center p-3 md:p-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="size-16 md:size-24 rounded-full bg-white shadow-sm flex items-center justify-center z-10 mb-3 md:mb-4 overflow-hidden">
                  <Image
                    src={style.image}
                    alt={`${style.name} style example`}
                    width={96}
                    height={96}
                    className="object-cover w-16 h-16 md:w-24 md:h-24"
                  />
                </div>

                <div className="z-10 text-center">
                  <h3 className="font-bold text-foreground text-sm md:text-lg">
                    {style.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 font-medium leading-tight">
                    {style.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample stickers showcase */}
        <div className="mt-16 md:mt-24 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8">Generated Examples</h3>
          <div className="grid grid-cols-3 md:flex md:justify-center gap-3 md:gap-4 max-w-sm md:max-w-none mx-auto">
            {[
              { image: "/landing/sticker-wave.png", text: "Hore!" },
              { image: "/landing/sticker-thinking.png", text: "Hmm..." },
              { image: "/landing/sticker-love.png", text: "Love!" },
              { image: "/landing/sticker-shy.png", text: "Oops!" },
              { image: "/landing/sticker-sleepy.png", text: "Zzz..." },
              { image: "/landing/sticker-celebrate.png", text: "Yay!" }
            ].map((sticker, i) => (
              <div
                key={i}
                className="aspect-square md:size-32 rounded-xl md:rounded-2xl bg-white border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center hover:scale-105 md:hover:scale-110 transition-transform duration-300 overflow-hidden p-1.5 md:p-2"
              >
                <Image
                  src={sticker.image}
                  alt={sticker.text}
                  width={80}
                  height={80}
                  className="object-contain mb-0.5 md:mb-1 w-14 h-14 md:w-20 md:h-20"
                />
                <span className="text-[10px] md:text-sm font-bold text-gray-600">{sticker.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-4 md:mt-6 text-pretty px-4">
            * Actual results will vary based on your photo and selected style.
          </p>
        </div>
      </div>
    </section>
  );
}
