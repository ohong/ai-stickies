import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { MockWindow } from '../components/MockWindow';
import { StickyNote } from '../components/StickyNote';

const NOTES = [
    { id: 1, text: "Design UI", color: "bg-blue-200" },
    { id: 2, text: "Database Schema", color: "bg-red-200" },
    { id: 3, text: "API Routes", color: "bg-red-200" },
    { id: 4, text: "User Testing", color: "bg-blue-200" },
    { id: 5, text: "Marketing", color: "bg-green-200" },
    { id: 6, text: "Sales", color: "bg-green-200" },
];

export const AIProcess: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Organize trigger
    const organizeProgress = spring({
        frame: frame - 40,
        fps,
        config: { damping: 14 }
    });

    // Magic wand / AI indicator opacity
    const aiOpacity = interpolate(frame, [10, 30, 80, 100], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
    const aiScale = interpolate(frame, [10, 30], [0.5, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill className="bg-gray-100">
            <MockWindow>
                {NOTES.map((note, index) => {
                    // Random chaotic positions
                    const randomX = (Math.sin(index * 123) * 400) + 800;
                    const randomY = (Math.cos(index * 321) * 200) + 400;
                    const randomRot = (Math.sin(index) * 20);

                    // Organized positions (Grid)
                    const col = index % 3;
                    const row = Math.floor(index / 3);
                    const organizedX = 500 + (col * 250);
                    const organizedY = 200 + (row * 250);
                    const organizedRot = 0;

                    const x = interpolate(organizeProgress, [0, 1], [randomX, organizedX]);
                    const y = interpolate(organizeProgress, [0, 1], [randomY, organizedY]);
                    const rot = interpolate(organizeProgress, [0, 1], [randomRot, organizedRot]);

                    return (
                        <StickyNote 
                            key={note.id}
                            x={x}
                            y={y}
                            text={note.text}
                            color={note.color}
                            rotation={rot}
                            delay={index * 2}
                        />
                    );
                })}

                <div 
                    className="absolute bottom-10 right-10 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
                    style={{ opacity: aiOpacity, transform: `scale(${aiScale})` }}
                >
                    <span className="text-2xl animate-pulse">✨</span>
                    <span className="font-bold">AI Organizing...</span>
                </div>
            </MockWindow>
        </AbsoluteFill>
    );
};
