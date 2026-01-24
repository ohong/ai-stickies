import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile, Sequence } from "remotion";
import { TypingInput } from "./TypingInput";
import { CursorAndFile } from "./CursorAndFile";

const MouseCursor: React.FC<{ x: number, y: number, click?: boolean }> = ({ x, y, click }) => {
  return (
    <div style={{ 
      position: 'absolute', 
      left: 0, 
      top: 0, 
      transform: `translate(${x}px, ${y}px) scale(${click ? 0.8 : 1})`,
      transition: 'transform 0.1s',
      pointerEvents: 'none',
      zIndex: 100
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="black" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  );
};

export const AppInterface: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- STAGE TIMINGS ---
  const T_UPLOAD = 0;
  const T_CONTEXT = 300;
  const T_PREVIEW = 750;
  const T_RESULTS = 1200;
  const T_DETAIL = 1650;
  const T_EXPORT = 1950;
  
  // --- ANIMATION CURVES ---
  // Same as before...
  const uploadOpacity = interpolate(frame, [T_UPLOAD, T_UPLOAD + 50, T_CONTEXT - 50, T_CONTEXT], [0, 1, 1, 0]);
  const contextOpacity = interpolate(frame, [T_CONTEXT, T_CONTEXT + 50, T_PREVIEW - 50, T_PREVIEW], [0, 1, 1, 0]);
  const previewOpacity = interpolate(frame, [T_PREVIEW, T_PREVIEW + 50, T_RESULTS - 50, T_RESULTS], [0, 1, 1, 0]);
  const resultsOpacity = interpolate(frame, [T_RESULTS, T_RESULTS + 50, T_EXPORT - 50, T_EXPORT], [0, 1, 1, 0]); 
  const exportOpacity = interpolate(frame, [T_EXPORT, T_EXPORT + 50], [0, 1]);

  // Mouse Animation Logic
  const mouseX = interpolate(frame, 
    [0, 100, 350, 450, 800, 850, 1250, 1300, 1900, 1950], 
    [1200, 600, 600, 400, 400, 600, 600, 300, 300, 1000]
  );
  const mouseY = interpolate(frame, 
    [0, 100, 350, 450, 800, 850, 1250, 1300, 1900, 1950], 
    [800, 400, 400, 300, 300, 400, 400, 300, 300, 100]
  );
  const mouseClick = (frame > 840 && frame < 850) || (frame > 1290 && frame < 1300) || (frame > 1940 && frame < 1950);

  // Common Header Component
  const Header = () => (
    <div className="flex justify-between items-center mb-4 h-16 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Stickies</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
           🖼️ 7/10 remaining
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-white p-8 font-sans relative overflow-hidden flex flex-col">
      <Header />

      <div className="flex-1 relative">
        
        {/* === STAGE 1 & 2: UPLOAD & CUSTOMIZE (Combined View) === */}
        {/* We keep the fade transition but visually structure it like the reference */}
        <div style={{ opacity: Math.max(uploadOpacity, contextOpacity) }} className="absolute inset-0 p-8">
            <div className="text-center mb-8">
               <div className="text-green-500 font-bold text-sm tracking-widest mb-2">STEP 1</div>
               <h2 className="text-4xl font-bold text-gray-900 mb-2">Upload & Customize</h2>
               <p className="text-gray-500">Add your photo and personalize your sticker pack</p>
            </div>

            <div className="flex gap-12 h-[600px]">
                {/* Left Col: Upload */}
                <div className="flex-1 flex flex-col">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">1</div>
                      <span className="font-bold text-gray-700">Your Photo</span>
                   </div>
                   
                   <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Upload State */}
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-2xl">🖼️</div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">Drop your photo here</h3>
                        <p className="text-gray-400 text-sm mb-4">or click to browse</p>
                        <div className="flex gap-2 justify-center text-xs text-gray-400">
                           <span className="bg-white px-2 py-1 rounded border">JPG</span>
                           <span className="bg-white px-2 py-1 rounded border">PNG</span>
                           <span className="bg-white px-2 py-1 rounded border">Max 10MB</span>
                        </div>
                      </div>
                      
                      {/* Dropped Image (Controlled by CursorAndFile logic) */}
                      <CursorAndFile startFrame={50} />
                   </div>
                </div>

                {/* Right Col: Customize */}
                <div className="flex-1 flex flex-col">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</div>
                      <span className="font-bold text-gray-700">Customize</span>
                   </div>

                   <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex-1 flex flex-col gap-6">
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Style Description <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="border border-gray-200 rounded-xl p-4 h-32 bg-white text-gray-600 text-sm">
                           <TypingInput text="Pastel colors, soft vibes, cute anime style" startFrame={T_CONTEXT + 20} active={frame < 460} />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">500 characters remaining</div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Personal Context <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="border border-gray-200 rounded-xl p-4 h-32 bg-white text-gray-600 text-sm">
                           <TypingInput text="Loves bubble tea and gaming, software dev" startFrame={T_CONTEXT + 80} active={frame >= 460} />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">500 characters remaining</div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sticker Text Language</label>
                        <div className="border border-gray-200 rounded-xl p-3 bg-white text-gray-800 text-sm flex justify-between items-center">
                           <span>English</span>
                           <span className="text-gray-400">▼</span>
                        </div>
                      </div>

                   </div>
                </div>
            </div>

            <div className="flex justify-center mt-8">
               <div className="bg-green-500 text-white px-12 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                  Generate Previews <span>→</span>
               </div>
            </div>
        </div>


        {/* === STAGE 3: PREVIEW (Select Styles) === */}
        <div style={{ opacity: previewOpacity }} className="absolute inset-0 p-8 flex flex-col items-center">
          <div className="text-center mb-8">
               <div className="text-green-500 font-bold text-sm tracking-widest mb-2">STEP 2</div>
               <h2 className="text-4xl font-bold text-gray-900 mb-2">Select Your Styles</h2>
               <p className="text-gray-500">Choose 1-5 styles to generate full sticker packs</p>
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-4 mb-8 flex justify-between items-center border border-gray-200">
             <div className="flex items-center gap-2 text-gray-500 text-sm">
                <span>ⓘ</span> Select at least 1 style
             </div>
             <div className="text-gray-400 text-sm">Max 5 styles</div>
          </div>

          <div className="flex gap-6 w-full justify-center">
            {['Chibi', 'Minimalist', 'Abstract', 'Stylized', 'High Fidelity'].map((style, i) => {
               const delay = T_PREVIEW + (i * 10);
               const scale = spring({ frame: frame - delay, fps, config: { stiffness: 100 } });
               const isSelected = (style === 'Chibi') && frame > 850;
               
               // Map to our existing assets, reusing some for demo
               const assetMap = ["style_chibi.png", "sticker_think.png", "style_abstract.png", "sticker_game.png", "style_hifi.png"];
               
               return (
                 <div key={i} style={{ transform: `scale(${scale})` }} 
                      className={`w-56 rounded-2xl border-2 overflow-hidden transition-all duration-300 bg-white flex flex-col ${isSelected ? 'border-green-500 ring-4 ring-green-50 shadow-xl' : 'border-gray-100 shadow-sm'}`}>
                   <div className="aspect-square bg-gray-50 relative p-4">
                     <Img src={staticFile(assetMap[i])} className="w-full h-full object-contain" />
                     {/* Checkbox circle */}
                     <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`} />
                   </div>
                   <div className="p-4">
                     <h3 className="font-bold text-gray-800 mb-1">{style}</h3>
                     <p className="text-xs text-gray-400 leading-relaxed">
                        {style === 'Chibi' ? 'Cute, super-deformed style with big head' : 
                         style === 'High Fidelity' ? 'Detailed, realistic representation' : 'Clean artistic interpretation'}
                     </p>
                   </div>
                 </div>
               );
            })}
          </div>

          <div className="flex justify-center mt-12 gap-4">
               <div className="px-8 py-3 rounded-full font-bold text-gray-600 border border-gray-300 bg-white">Back</div>
               <div className="bg-green-400 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
                  Generate Packs <span>→</span>
               </div>
          </div>
        </div>

        {/* === STAGE 4 & 5: RESULTS & DETAIL === */}
        <div style={{ opacity: resultsOpacity }} className="absolute inset-0 p-8 flex flex-col items-center">
           <div className="text-center mb-8">
               <div className="text-green-500 font-bold text-sm tracking-widest mb-2 uppercase">Complete</div>
               <h2 className="text-4xl font-bold text-gray-900 mb-2">Your Sticker Packs Are Ready</h2>
               <p className="text-gray-500">1 pack with 10 stickers generated. Download them individually or all at once.</p>
           </div>

           <div className="w-full max-w-6xl border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-gray-800">Chibi</h3>
                    <p className="text-sm text-gray-400">10 stickers</p>
                 </div>
                 <div className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50">
                    ⬇ Download Pack
                 </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                  {["sticker_1.png", "sticker_2.png", "sticker_3.png", "sticker_4.png", "sticker_5.png", 
                    "sticker_6.png", "sticker_7.png", "sticker_8.png", "sticker_9.png", "sticker_10.png"].map((src, i) => {
                     const delay = T_RESULTS + (i * 3);
                     const scale = spring({ frame: frame - delay, fps, config: { stiffness: 200 } });
                     
                     // Use real assets from the provided folder structure
                     // We'll map them sequentially
                     
                     const isDetailTarget = i === 4;
                     const detailProgress = spring({ frame: frame - T_DETAIL, fps, config: { damping: 20 } });
                     const detailScale = interpolate(detailProgress, [0, 1], [1, 3.5]);
                     const detailX = interpolate(detailProgress, [0, 1], [0, -400]); 
                     const detailY = interpolate(detailProgress, [0, 1], [0, 150]);
                     const zIndex = isDetailTarget && frame > T_DETAIL ? 50 : 0;

                     return (
                       <div key={i} style={{ 
                           transform: `scale(${scale * (isDetailTarget && frame > T_DETAIL ? detailScale : 1)}) translate(${isDetailTarget && frame > T_DETAIL ? detailX : 0}px, ${isDetailTarget && frame > T_DETAIL ? detailY : 0}px)`,
                           zIndex 
                         }} 
                         className="aspect-square bg-pink-50 rounded-2xl p-2 border border-gray-100 relative shadow-sm hover:shadow-md transition-shadow flex items-center justify-center overflow-hidden">
                         {/* Using the newly copied assets */}
                         <Img src={staticFile(src)} className="w-full h-full object-contain" />
                         
                         {isDetailTarget && frame > T_DETAIL && (
                           <div 
                            style={{ 
                              opacity: detailProgress,
                              transform: `scale(${1 / 3.5})`,
                              transformOrigin: 'bottom center'
                            }} 
                            className="absolute left-1/2 -translate-x-1/2 -bottom-12 bg-black text-white px-4 py-2 rounded-full text-sm whitespace-nowrap shadow-lg z-50">
                             High Quality PNG
                           </div>
                         )}
                       </div>
                     );
                  })}
               </div>
               
               <div className="flex justify-center gap-4 mt-8">
                  <div className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-green-600 transition-colors">
                     📦 Download All (1 packs)
                  </div>
                  <div className="border border-gray-200 text-gray-700 px-8 py-3 rounded-full font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50">
                     💬 Export for LINE
                  </div>
               </div>
           </div>
        </div>

        {/* === STAGE 6: EXPORT === */}
        <div style={{ opacity: exportOpacity }} className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50">
           <div className="text-center">
             <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
               <span className="text-4xl text-white">✓</span>
             </div>
             <h2 className="text-4xl font-bold text-gray-800 mb-2">Pack Exported!</h2>
             <p className="text-xl text-gray-500">Synced to LINE Desktop</p>
             
             <div className="mt-12 w-64 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center px-4 gap-4 mx-auto">
                <div className="w-8 h-10 bg-yellow-400 rounded-sm" />
                <div className="text-left">
                  <div className="font-bold text-sm">sticker_pack.zip</div>
                  <div className="text-xs text-gray-400">4.2 MB • Completed</div>
                </div>
             </div>
           </div>
        </div>

      </div>

      <MouseCursor x={mouseX} y={mouseY} click={mouseClick} />
    </div>
  );
};
