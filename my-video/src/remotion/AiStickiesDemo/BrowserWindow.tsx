import React from "react";
import { AbsoluteFill } from "remotion";
import { AppInterface } from "./AppInterface";

export const BrowserWindow: React.FC = () => {
  return (
    <AbsoluteFill className="flex items-center justify-center p-12 bg-transparent">
      <div
        className="w-[1200px] h-[800px] rounded-xl overflow-hidden flex flex-col shadow-2xl"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Toolbar */}
        <div className="h-14 bg-[#f1f3f4] flex items-center px-4 gap-4 border-b border-[#e0e0e0]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          
          {/* Address Bar */}
          <div className="flex-1 flex justify-center px-4">
             <div className="bg-white h-8 w-full max-w-2xl rounded-md border border-gray-300 flex items-center px-3 text-xs text-gray-500 shadow-sm">
                <span className="mr-2">🔒</span>
                https://aistickies.com/
             </div>
          </div>
        </div>
        
        {/* Content */}
        <AppInterface />
      </div>
    </AbsoluteFill>
  );
};
