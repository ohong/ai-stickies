import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const TextOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 80, 90], [0, 1, 1, 0]);
  const y = interpolate(frame, [0, 90], [20, -20]);

  return (
    <AbsoluteFill className="flex items-center justify-center pointer-events-none z-50">
      <h2
        className="text-6xl font-black text-white text-center tracking-tight"
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}
      >
        {text}
      </h2>
    </AbsoluteFill>
  );
};
