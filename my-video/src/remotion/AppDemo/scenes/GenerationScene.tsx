import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const GenerationScene: React.FC = () => {
    const frame = useCurrentFrame();

    const rotation = frame * 5;
    const pulse = interpolate(frame % 30, [0, 15, 30], [1, 1.2, 1]);

    return (
        <AbsoluteFill className="bg-slate-900 flex items-center justify-center">
            <div className="relative">
                {/* Magic Ring */}
                <div 
                    className="w-64 h-64 border-4 border-blue-500 rounded-full border-t-transparent"
                    style={{ transform: `rotate(${rotation}deg)` }}
                />
                <div 
                    className="w-48 h-48 border-4 border-purple-500 rounded-full border-b-transparent absolute top-8 left-8"
                    style={{ transform: `rotate(-${rotation * 1.5}deg)` }}
                />
                
                {/* Center Icon */}
                <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `scale(${pulse})` }}
                >
                    <span className="text-6xl">✨</span>
                </div>
            </div>

            <h2 className="text-white text-5xl font-bold mt-12 animate-pulse">
                AI Magic in Progress...
            </h2>
            <p className="text-slate-400 text-2xl mt-4">Generating 10 unique stickers</p>
        </AbsoluteFill>
    );
};
