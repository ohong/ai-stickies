import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Kalam";

const { fontFamily } = loadFont();

export const ProblemScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 30], [0, 1]);
    const textY = spring({ frame, fps, from: 50, to: 0 });

    // Animated emojis falling or floating
    const emojis = ["😐", "🤷‍♂️", "🥱", "📉"];

    return (
        <AbsoluteFill className="bg-slate-100 flex items-center justify-center">
             <div className="absolute inset-0 overflow-hidden">
                {emojis.map((emoji, index) => {
                    const delay = index * 15;
                    const drop = interpolate(frame - delay, [0, 100], [-100, 1200]);
                    const x = 200 + (index * 400);
                    return (
                        <div 
                            key={index} 
                            style={{ 
                                position: 'absolute', 
                                left: x, 
                                top: drop,
                                fontSize: '150px' 
                            }}
                        >
                            {emoji}
                        </div>
                    )
                })}
            </div>

            <div className="z-10 text-center bg-white/80 p-12 rounded-3xl backdrop-blur-sm shadow-xl">
                <h2 
                    style={{ opacity, transform: `translateY(${textY}px)`, fontFamily }} 
                    className="text-7xl font-bold text-slate-800 mb-6"
                >
                    Tired of generic stickers?
                </h2>
                <p 
                    style={{ opacity: interpolate(frame, [30, 60], [0, 1]) }}
                    className="text-4xl text-slate-600"
                >
                    They just don't feel like YOU.
                </p>
            </div>
        </AbsoluteFill>
    );
};
