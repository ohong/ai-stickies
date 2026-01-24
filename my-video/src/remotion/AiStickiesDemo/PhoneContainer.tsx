import React from "react";
import { AbsoluteFill } from "remotion";

export const PhoneContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill className="flex items-center justify-center">
      <div
        className="relative w-[400px] h-[800px] bg-black rounded-[50px] shadow-2xl border-[12px] border-[#1a1a1a] overflow-hidden"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
      >
        {/* The Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50" />

        {/* Screen Content */}
        <div className="w-full h-full bg-white relative">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full z-50" />
      </div>
    </AbsoluteFill>
  );
};
