import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { MockWindow } from '../components/MockWindow';
import { Cursor } from '../components/Cursor';

export const UploadScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const cursorX = interpolate(frame, [20, 50, 80], [1200, 960, 960], { extrapolateRight: 'clamp' });
    const cursorY = interpolate(frame, [20, 50, 80], [800, 540, 540], { extrapolateRight: 'clamp' });
    const click = frame > 50 && frame < 55;

    const showPhoto = frame > 55;

    return (
        <AbsoluteFill className="bg-blue-50">
            <div className="absolute top-20 w-full text-center">
                <h2 className="text-6xl font-bold text-slate-800">1. Upload your selfie</h2>
            </div>
            
            <MockWindow>
                <div className="w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-300 rounded-lg bg-gray-50 m-10">
                    {!showPhoto ? (
                        <>
                            <div className="text-6xl mb-4">📸</div>
                            <p className="text-2xl text-gray-400">Drag & Drop or Click to Upload</p>
                        </>
                    ) : (
                        <div className="relative w-64 h-64 bg-gray-200 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                            {/* Placeholder for user selfie */}
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-300">
                                <span className="text-8xl">👤</span>
                             </div>
                             <div className="absolute bottom-4 right-4 bg-green-500 text-white p-2 rounded-full">
                                ✓
                             </div>
                        </div>
                    )}
                </div>
                <Cursor x={cursorX} y={cursorY} click={click} />
            </MockWindow>
        </AbsoluteFill>
    );
};
