import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { StickyNote } from '../components/StickyNote';

export const Intro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleOpacity = interpolate(frame, [10, 30], [0, 1]);
    const titleScale = spring({
        frame: frame - 10,
        fps,
        from: 0.8,
        to: 1,
        config: { damping: 12 }
    });

    const subTitleOpacity = interpolate(frame, [30, 50], [0, 1]);
    const subTitleY = interpolate(frame, [30, 50], [20, 0], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill className="bg-white items-center justify-center overflow-hidden">
             {/* Background Elements */}
            <StickyNote x={100} y={100} rotation={-10} color="bg-blue-100" delay={0} />
            <StickyNote x={1600} y={200} rotation={15} color="bg-red-100" delay={5} />
            <StickyNote x={200} y={800} rotation={5} color="bg-green-100" delay={10} />
            <StickyNote x={1500} y={700} rotation={-5} color="bg-yellow-100" delay={15} />

            <div className="z-10 text-center">
                <h1 
                    style={{ 
                        opacity: titleOpacity, 
                        transform: `scale(${titleScale})` 
                    }}
                    className="text-9xl font-black text-slate-800 tracking-tighter"
                >
                    AI Stickies
                </h1>
                <p 
                    style={{ 
                        opacity: subTitleOpacity,
                        transform: `translateY(${subTitleY}px)`
                    }}
                    className="text-4xl text-slate-500 mt-8 font-light"
                >
                    Brainstorming reinvented.
                </p>
            </div>
        </AbsoluteFill>
    );
};
