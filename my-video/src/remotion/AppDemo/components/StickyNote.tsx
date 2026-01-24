import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Kalam";

const { fontFamily } = loadFont();

interface StickyNoteProps {
    color?: string;
    text?: string;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    delay?: number;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ 
    color = "bg-yellow-200", 
    text = "", 
    x, 
    y, 
    rotation = 0,
    scale = 1,
    delay = 0
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Pop in animation
    const enterFrame = Math.max(0, frame - delay);
    const pop = interpolate(enterFrame, [0, 10, 15], [0, 1.1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <div 
            className={`absolute w-48 h-48 ${color} shadow-md p-4 rounded-sm flex items-center justify-center text-center`}
            style={{
                left: x,
                top: y,
                transform: `rotate(${rotation}deg) scale(${scale * pop})`,
                fontFamily
            }}
        >
            <p className="text-gray-800 font-medium text-2xl leading-tight">{text}</p>
        </div>
    );
};
