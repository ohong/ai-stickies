import React from "react";
import { useCurrentFrame, interpolate, Img, staticFile } from "remotion";

export const CursorAndFile: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  
  // Local frame time relative to start
  const t = frame - startFrame;

  const dropProgress = interpolate(t, [10, 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const y = interpolate(dropProgress, [0, 1], [600, 0]); // Flies in from bottom to center
  const scale = interpolate(dropProgress, [0, 1], [1.5, 1]);

  // Only show during the drop phase
  if (t < 0) return null;

  // After dropping, it stays "snapped" in place
  const isSnapped = t > 40;

  return (
    <div 
      style={{ 
        transform: isSnapped ? 'none' : `translateY(${y}px) scale(${scale})`,
        opacity: isSnapped ? 1 : interpolate(t, [0, 10], [0, 1])
      }} 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 ${isSnapped ? 'p-8' : ''}`}
    >
       <Img 
         src={staticFile("selfie.jpg")} 
         className={`rounded-lg shadow-xl object-cover ${isSnapped ? 'w-full h-full rotate-0' : 'w-48 h-64 rotate-3'}`} 
       />
    </div>
  );
};
