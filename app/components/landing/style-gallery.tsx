const styles = [
  {
    name: "High Fidelity",
    description: "Detailed cartoon portraits",
    color: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "🎨"
  },
  {
    name: "Stylized",
    description: "Cute blob characters",
    color: "bg-pink-50",
    borderColor: "border-pink-200",
    icon: "✨"
  },
  {
    name: "Abstract",
    description: "Animal & object mashups",
    color: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "🌀"
  },
  {
    name: "Chibi",
    description: "Big head, tiny body",
    color: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: "👶"
  },
  {
    name: "Minimalist",
    description: "Simple line art style",
    color: "bg-green-50",
    borderColor: "border-green-200",
    icon: "✏️"
  },
];

export function StyleGallery() {
  return (
    <section id="styles" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-[#09C754] font-bold text-sm uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
            Art Styles
          </span>
          <h2 className="mt-6 text-3xl md:text-5xl font-black text-foreground text-balance">
            5 unique styles to choose from
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
            Each style brings out a different personality. Pick one that matches yours.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {styles.map((style, index) => (
            <div key={style.name} className="group cursor-pointer">
              <div className={`aspect-[4/5] rounded-2xl ${style.color} border-2 ${style.borderColor} flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-lg relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="size-20 md:size-24 rounded-full bg-white shadow-sm flex items-center justify-center z-10 mb-4 text-4xl">
                  {style.icon}
                </div>
                
                <div className="z-10 text-center">
                   <h3 className="font-bold text-foreground text-base md:text-lg">
                    {style.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {style.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample stickers showcase */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">Generated Examples</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            {/* We use placeholders here but in production these would be the provided assets */}
            {[
              { emoji: "👋", text: "Hore!" },
              { emoji: "🙏", text: "Sorry!" },
              { emoji: "😍", text: "Love!" },
              { emoji: "😤", text: "Hmph!" },
              { emoji: "😴", text: "Zzz..." },
              { emoji: "🎉", text: "Yay!" }
            ].map((sticker, i) => (
              <div
                key={i}
                className="size-24 md:size-32 rounded-2xl bg-white border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center hover:scale-110 transition-transform duration-300"
              >
                <span className="text-3xl md:text-4xl mb-2">{sticker.emoji}</span>
                <span className="text-xs md:text-sm font-bold text-gray-600">{sticker.text}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6 text-pretty">
            * Actual results will vary based on your photo and selected style.
          </p>
        </div>
      </div>
    </section>
  );
}
