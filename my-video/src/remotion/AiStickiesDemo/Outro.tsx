import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 15 } });
  const y = interpolate(progress, [0, 1], [100, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill className="bg-white flex items-center justify-center flex-col">
      <h1 className="text-8xl font-black text-gray-900 tracking-tighter mb-4"
          style={{ transform: `translateY(${y}px)`, opacity }}>
        AI Stickies
      </h1>
      <p className="text-3xl text-gray-500 font-medium mb-2"
         style={{ transform: `translateY(${y + 20}px)`, opacity }}>
        Express Yourself
      </p>
      <p className="text-xl text-green-500 font-bold"
         style={{ transform: `translateY(${y + 20}px)`, opacity }}>
        aistickies.com
      </p>
    </AbsoluteFill>
  );
};
