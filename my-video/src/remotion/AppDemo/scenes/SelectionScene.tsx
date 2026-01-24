import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { MockWindow } from '../components/MockWindow';

const STYLES = [
    { name: "High Fidelity", color: "bg-orange-100", icon: "🎨" },
    { name: "Chibi", color: "bg-pink-100", icon: "👶" },
    { name: "Abstract", color: "bg-purple-100", icon: "🎭" },
    { name: "Minimalist", color: "bg-gray-100", icon: "✏️" },
];

export const SelectionScene: React.FC = () => {
    const frame = useCurrentFrame();

    return (
        <AbsoluteFill className="bg-pink-50">
             <div className="absolute top-20 w-full text-center">
                <h2 className="text-6xl font-bold text-slate-800">2. Choose your style</h2>
            </div>

            <MockWindow>
                <div className="grid grid-cols-2 gap-8 p-12 h-full items-center">
                    {STYLES.map((style, index) => {
                        const scale = interpolate(frame - (index * 10), [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                        const isSelected = index === 1; // Select Chibi

                        return (
                            <div 
                                key={index}
                                style={{ transform: `scale(${scale})` }}
                                className={`
                                    p-6 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-colors
                                    ${isSelected && frame > 60 ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-200' : 'border-gray-200 bg-white'}
                                `}
                            >
                                <div className={`w-20 h-20 rounded-full ${style.color} flex items-center justify-center text-4xl`}>
                                    {style.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{style.name}</h3>
                                    <p className="text-slate-500">AI generated style</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </MockWindow>
        </AbsoluteFill>
    );
};
