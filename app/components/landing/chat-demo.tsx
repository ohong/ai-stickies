"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";

// Conversation that showcases AI Stickies value prop
const conversation = [
  { type: "message", from: "me", text: "Check out my new stickers!", delay: 600 },
  { type: "sticker", from: "me", src: "/stickers/chibi/01.png", delay: 1600 },
  { type: "message", from: "friend", text: "Omg is that you?? 😍", delay: 3000 },
  { type: "message", from: "me", text: "Yep! Made on AIStickies.com", delay: 4200 },
  { type: "sticker", from: "me", src: "/stickers/chibi/07.png", delay: 5400 },
  { type: "hearts", delay: 6200 },
];

export function ChatDemo() {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [showHearts, setShowHearts] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection observer
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setVisibleItems(conversation.map((_, i) => i));
      setShowHearts(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  // Animation sequence
  useEffect(() => {
    if (!isInView) return;

    const timeouts: NodeJS.Timeout[] = [];

    conversation.forEach((item, index) => {
      if (item.type === "hearts") {
        timeouts.push(setTimeout(() => setShowHearts(true), item.delay));
      } else {
        timeouts.push(setTimeout(() => {
          setVisibleItems(prev => [...prev, index]);
        }, item.delay));
      }
    });

    // Reset and loop
    const totalDuration = Math.max(...conversation.map(c => c.delay)) + 3500;
    timeouts.push(setTimeout(() => {
      setVisibleItems([]);
      setShowHearts(false);
      setCycleKey(k => k + 1);
      setIsInView(false);
      setTimeout(() => setIsInView(true), 400);
    }, totalDuration));

    return () => timeouts.forEach(clearTimeout);
  }, [isInView, cycleKey]);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-[#0CC755] font-bold text-xs md:text-sm uppercase tracking-widest">
            Why Custom Stickers?
          </span>
          <h2 className="mt-4 md:mt-6 text-2xl md:text-4xl font-black text-foreground text-balance">
            Express yourself like never before
          </h2>
          <p className="mt-3 md:mt-4 text-muted-foreground max-w-lg mx-auto text-sm md:text-base text-pretty">
            Generic stickers are boring. Send stickers that actually look like you.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20">
          {/* Chat mockup */}
          <div className="relative">
            {/* STICKER button */}
            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-4 z-20">
              <div className="bg-[#0CC755] text-white font-bold text-[11px] md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md">
                STICKER
              </div>
            </div>

            {/* Chat window */}
            <div className="relative w-[300px] md:w-[360px]">
              {/* Main chat area */}
              <div className="relative bg-[#8FAABE] rounded-t-[28px] md:rounded-t-[36px] overflow-hidden shadow-lg">
                <div className="h-[360px] md:h-[420px] px-3 md:px-4 py-4 md:py-5 flex flex-col gap-2.5 md:gap-3 overflow-hidden">
                  {conversation.map((item, index) => {
                    if (item.type === "hearts") return null;

                    const isVisible = visibleItems.includes(index);
                    const isMe = item.from === "me";
                    const isLastFriendSticker = item.type === "sticker" && item.from === "friend" &&
                      index === conversation.filter(c => c.type === "sticker" && c.from === "friend").length +
                      conversation.findIndex(c => c.type === "sticker" && c.from === "friend");

                    // Check if this is the last sticker
                    const lastStickerIndex = [...conversation].reverse().findIndex(c => c.type === "sticker");
                    const isLastSticker = lastStickerIndex >= 0 && index === conversation.length - 1 - lastStickerIndex - 1; // -1 for hearts

                    if (item.type === "message") {
                      return (
                        <div
                          key={`${cycleKey}-${index}`}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} transition-all duration-300 ease-out ${
                            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                          }`}
                        >
                          <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? "flex-row-reverse" : ""}`}>
                            {/* Avatar */}
                            {!isMe && (
                              <div className="size-7 md:size-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/50 shadow-sm -mb-1">
                                <Image
                                  src="/stickers/chibi/main.png"
                                  alt="Friend"
                                  width={32}
                                  height={32}
                                  className="size-full object-cover"
                                />
                              </div>
                            )}
                            {/* Bubble */}
                            <div className={`relative px-3.5 md:px-4 py-2 md:py-2.5 shadow-sm ${
                              isMe
                                ? "bg-[#0CC755] text-white rounded-2xl rounded-br-md"
                                : "bg-white text-gray-800 rounded-2xl rounded-bl-md"
                            }`}>
                              <p className="text-[13px] md:text-[15px] font-medium leading-snug">{item.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === "sticker") {
                      return (
                        <div
                          key={`${cycleKey}-${index}`}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} transition-all duration-300 ease-out ${
                            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
                          }`}
                        >
                          <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            {/* Avatar */}
                            {!isMe && (
                              <div className="size-7 md:size-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/50 shadow-sm -mb-1">
                                <Image
                                  src="/stickers/chibi/main.png"
                                  alt="Friend"
                                  width={32}
                                  height={32}
                                  className="size-full object-cover"
                                />
                              </div>
                            )}
                            {/* Sticker */}
                            <div className="relative">
                              <div className="size-24 md:size-28 relative">
                                <Image
                                  src={item.src || ""}
                                  alt="Sticker"
                                  fill
                                  className="object-contain drop-shadow-md"
                                />
                              </div>
                              {/* Hearts on last sticker */}
                              {index === 4 && showHearts && (
                                <div className="absolute -right-1 -top-1 flex flex-col gap-0.5">
                                  <span className="text-pink-400 text-sm md:text-base animate-pulse">❤</span>
                                  <span className="text-pink-300 text-xs md:text-sm ml-1.5 animate-pulse" style={{ animationDelay: "100ms" }}>❤</span>
                                  <span className="text-pink-400 text-[10px] md:text-xs animate-pulse" style={{ animationDelay: "200ms" }}>❤</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>

              {/* Bottom stand */}
              <div className="h-2.5 md:h-3 bg-gray-900 rounded-b-lg" />
            </div>
          </div>

          {/* Value props */}
          <div className="flex flex-col gap-5 md:gap-6 max-w-sm lg:max-w-md">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="size-11 md:size-12 rounded-xl bg-[#0CC755] flex items-center justify-center flex-shrink-0">
                <svg className="size-5 md:size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Stand out in group chats</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">
                  Your friends will instantly recognize your stickers among hundreds of generic ones
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="size-11 md:size-12 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
                <svg className="size-5 md:size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-foreground">More personal than emoji</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">
                  Show your unique personality with stickers that capture your expressions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100">
              <div className="size-11 md:size-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <svg className="size-5 md:size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-foreground">10 expressions included</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">
                  Happy, sad, excited, thankful — a perfect reaction for every moment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
