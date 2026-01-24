import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig, Img, staticFile, spring } from "remotion";

interface ChatProps {
  mode: 'intro' | 'payoff';
}

export const ChatInterface: React.FC<ChatProps> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- INTRO MODE LOGIC ---
  // Scroll generic stickers endlessly (Looping)
  // Grid height is roughly 120px * 8 rows = 960px.
  // We want to scroll nicely.
  const scrollY = interpolate(frame % 300, [0, 300], [0, -600]);

  // --- PAYOFF MODE LOGIC ---
  const sendSpring = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const reply1Spring = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const reply2Spring = spring({ frame: frame - 80, fps, config: { damping: 15 } });
  const reply3Spring = spring({ frame: frame - 100, fps, config: { damping: 15 } });

  // Background Pattern (SVG Dot Pattern)
  const bgPattern = {
    backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  };

  if (mode === 'intro') {
    return (
      <div className="flex flex-col h-full bg-[#f0f2f5]" style={bgPattern}>
        {/* Header */}
        <div className="bg-[#5ac463] h-16 w-full flex items-center px-4 text-white font-bold shadow-sm z-10 justify-between shrink-0">
           <div className="flex items-center gap-2">
             <span className="text-xl">‹</span>
             <span>Group Chat</span>
           </div>
           <span className="text-sm opacity-80">≡</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative p-4 pb-0">
          {/* Messages Background */}
          <div className="flex flex-col gap-3 opacity-30">
             <div className="self-start bg-white p-2 rounded-xl rounded-tl-none text-xs">boring...</div>
             <div className="self-end bg-[#85e690] p-2 rounded-xl rounded-tr-none text-xs">meh</div>
          </div>

          {/* Sticker Sheet Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col">
            {/* Sheet Header (Fixed) */}
            <div className="p-4 pb-2 z-10 bg-white rounded-t-3xl">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-gray-500 mb-2 text-xs font-bold uppercase tracking-wider">Default Stickers</h3>
            </div>
            
            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-hidden relative px-4">
              <div className="grid grid-cols-3 gap-3 pb-4" style={{ transform: `translateY(${scrollY}px)` }}>
                {/* 24 Generic Stickers to allow looping */}
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-4xl grayscale opacity-40 border border-gray-100">
                    {i % 2 === 0 ? '🐰' : '🐻'}
                  </div>
                ))}
              </div>
              {/* Fade out at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAYOFF MODE
  return (
    <div className="flex flex-col h-full bg-[#bfd9f2] font-sans relative overflow-hidden">
      {/* Cute Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 text-4xl">🌸</div>
        <div className="absolute top-40 right-10 text-4xl">⭐</div>
        <div className="absolute bottom-40 left-20 text-4xl">💖</div>
      </div>

      {/* LINE-style Header */}
      <div className="bg-[#6cc5c2] h-20 w-full absolute top-0 left-0 flex items-end pb-3 px-4 text-white font-bold z-10 shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <span className="text-2xl font-light">‹</span>
          <span className="text-lg flex-1">Alice</span>
          <span className="text-xl">🔍</span>
          <span className="text-xl ml-2">≡</span>
        </div>
      </div>

      <div className="mt-24 flex flex-col gap-4 px-4">
        {/* User Sending New Sticker */}
        <div style={{ transform: `scale(${sendSpring})`, opacity: sendSpring }} className="self-end origin-bottom-right relative mb-4">
          <Img src={staticFile("sticker_5.png")} className="w-40 h-40 drop-shadow-xl filter" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
          {/* "Read" status */}
          <span className="absolute bottom-2 -left-8 text-[10px] text-gray-500 font-bold">Read<br/>10:42</span>
        </div>

        {/* Friend Reply 1 */}
        <div style={{ transform: `scale(${reply1Spring})`, opacity: reply1Spring }} className="flex gap-2 self-start max-w-[85%] origin-bottom-left">
           <div className="w-8 h-8 rounded-full bg-yellow-200 border-2 border-white flex items-center justify-center text-lg shadow-sm z-10 shrink-0">
             👩🏻
           </div>
           <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
             <p className="text-sm font-bold text-gray-800">OMG is that you??</p>
           </div>
        </div>

        {/* Friend Reply 2 */}
        <div style={{ transform: `scale(${reply2Spring})`, opacity: reply2Spring }} className="flex gap-2 self-start max-w-[85%] origin-bottom-left ml-10">
           <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
             <p className="text-sm font-bold text-gray-800">So cute!! 😭💕</p>
           </div>
        </div>

        {/* Friend Reply 3 */}
        <div style={{ transform: `scale(${reply3Spring})`, opacity: reply3Spring }} className="flex gap-2 self-start max-w-[85%] origin-bottom-left ml-10">
           <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm">
             <p className="text-sm font-bold text-gray-800">Where did you get that?</p>
           </div>
        </div>
      </div>
      
      {/* Input Bar (Visual only) */}
      <div className="absolute bottom-0 w-full bg-white h-16 border-t border-gray-100 flex items-center px-4 gap-3">
         <div className="text-2xl text-gray-400">+</div>
         <div className="text-2xl text-gray-400">📷</div>
         <div className="text-2xl text-gray-400">🖼️</div>
         <div className="flex-1 bg-gray-100 h-9 rounded-full px-3 flex items-center text-gray-400 text-sm">Type a message...</div>
         <div className="text-2xl text-gray-400">😊</div>
      </div>
    </div>
  );
};
