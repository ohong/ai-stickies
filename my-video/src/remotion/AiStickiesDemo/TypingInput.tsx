import React from "react";
import { useCurrentFrame } from "remotion";

interface TypingInputProps {
  text: string;
  startFrame: number;
  active?: boolean;
}

export const TypingInput: React.FC<TypingInputProps> = ({ text, startFrame, active = true }) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, frame - startFrame);
  const charsToShow = Math.floor(progress / 3); // Speed: 1 char every 3 frames
  const currentText = text.slice(0, charsToShow);
  const isBlinking = Math.floor(frame / 15) % 2 === 0;
  const showCaret = active && isBlinking;

  return (
    <div className="flex items-center">
      <span className="text-gray-800 text-lg">{currentText}</span>
      <span className={`inline-block w-0.5 h-5 bg-blue-500 ml-1 ${showCaret ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};
