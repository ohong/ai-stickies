import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { StickyNote } from '../components/StickyNote';
import { loadFont } from "@remotion/google-fonts/Kalam";

const { fontFamily } = loadFont();

const STICKERS = [
    { text: "Good Morning!", emoji: "☀️", color: "bg-yellow-100" },
    { text: "So Sorry!", emoji: "🙇", color: "bg-blue-100" },
    { text: "Love it!", emoji: "😍", color: "bg-pink-100" },
    { text: "Working...", emoji: "💻", color: "bg-gray-100" },
    { text: "Coffee?", emoji: "☕", color: "bg-orange-100" },
    { text: "OK!", emoji: "👌", color: "bg-green-100" },
];

export const ResultScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill className="bg-white">
            <div className="absolute top-10 w-full text-center z-10">
                <h2 className="text-6xl font-bold text-slate-800">Your Personal Sticker Pack</h2>
            </div>

            <div className="grid grid-cols-3 gap-8 p-20 mt-10">
                {STICKERS.map((sticker, index) => {
                    const delay = index * 5;
                    const scale = spring({
                        frame: frame - delay,
                        fps,
                        config: { damping: 12 }
                    });

                    return (
                        <div 
                            key={index}
                            style={{ transform: `scale(${scale})` }}
                            className={`${sticker.color} rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg aspect-square border-4 border-white`}
                        >
                            <span className="text-6xl mb-4">{sticker.emoji}</span>
                            <span style={{ fontFamily }} className="text-3xl font-bold text-slate-700">{sticker.text}</span>
                        </div>
                    )
                })}
            </div>
        </AbsoluteFill>
    );
};
