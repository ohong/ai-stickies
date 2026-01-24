import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const Outro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame,
        fps,
        from: 0.5,
        to: 1,
        config: { damping: 10 }
    });

    const opacity = interpolate(frame, [0, 20], [0, 1]);

    return (
        <AbsoluteFill className="bg-slate-900 items-center justify-center">
            <div style={{ opacity, transform: `scale(${scale})` }} className="text-center">
                <h2 className="text-8xl font-bold text-white mb-8">
                    Your Face.<br/>
                    <span className="text-yellow-400">Your Stickers.</span>
                </h2>
                <div className="bg-white text-slate-900 px-8 py-4 rounded-full text-3xl font-bold inline-block hover:bg-gray-100">
                    ai-stickies.com
                </div>
            </div>
        </AbsoluteFill>
    );
};
