import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { MockWindow } from '../components/MockWindow';
import { StickyNote } from '../components/StickyNote';
import { Cursor } from '../components/Cursor';

export const CreateNote: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Cursor movement
    const cursorX = interpolate(frame, [0, 30, 60], [1200, 960, 960], { extrapolateRight: 'clamp' });
    const cursorY = interpolate(frame, [0, 30, 60], [800, 540, 540], { extrapolateRight: 'clamp' });
    const click = frame > 30 && frame < 35;

    // Note appearance
    const showNote = frame > 35;
    
    // Typing animation
    const text = "Plan Project Launch";
    const charsShown = Math.floor(interpolate(frame, [45, 80], [0, text.length], { extrapolateRight: 'clamp' }));
    const currentText = text.substring(0, charsShown);

    return (
        <AbsoluteFill className="bg-gray-100">
            <MockWindow>
                {showNote && (
                    <StickyNote 
                        x={800} // Center relative to container roughly
                        y={400} 
                        text={currentText}
                        color="bg-yellow-200"
                        delay={0}
                    />
                )}
                
                <Cursor x={cursorX} y={cursorY} click={click} />
            </MockWindow>
        </AbsoluteFill>
    );
};
