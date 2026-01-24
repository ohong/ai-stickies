import React from 'react';
import { AbsoluteFill } from 'remotion';

export const MockWindow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-10">
        <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col relative">
            <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 space-x-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 flex-1 flex justify-center">
                    <div className="bg-gray-200 h-6 w-64 rounded-md opacity-50"></div>
                </div>
            </div>
            <div className="flex-1 relative bg-gray-50 overflow-hidden">
                {children}
            </div>
        </div>
    </div>
  );
};
