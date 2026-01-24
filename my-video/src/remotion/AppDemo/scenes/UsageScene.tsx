import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const UsageScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const messages = [
        { type: 'sent', text: "Check out my new stickers!", time: 10 },
        { type: 'sent-sticker', emoji: "😍", text: "Love it!", time: 30 },
        { type: 'received', text: "OMG SO CUTE!! Where did you get these?", time: 60 },
        { type: 'sent', text: "AI Stickies! It's super easy.", time: 90 },
    ];

    return (
        <AbsoluteFill className="bg-slate-200 p-8 flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Chat Header */}
                <div className="bg-green-500 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/30 rounded-full"></div>
                    <div className="text-white font-bold text-2xl">Bestie ❤️</div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-slate-50 p-8 space-y-6 flex flex-col">
                    {messages.map((msg, index) => {
                        const show = frame > msg.time;
                        if (!show) return null;

                        const slide = spring({
                            frame: frame - msg.time,
                            fps,
                            from: 50,
                            to: 0
                        });

                        const isSent = msg.type.startsWith('sent');

                        return (
                            <div 
                                key={index}
                                style={{ transform: `translateY(${slide}px)` }}
                                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.type === 'sent-sticker' ? (
                                    <div className="bg-transparent">
                                        <div className="bg-pink-100 p-4 rounded-xl shadow-md border-2 border-pink-200 w-40 h-40 flex flex-col items-center justify-center">
                                            <span className="text-6xl">{msg.emoji}</span>
                                            <span className="font-bold text-slate-700">{msg.text}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`
                                        p-4 rounded-2xl max-w-md text-2xl
                                        ${isSent ? 'bg-green-500 text-white rounded-tr-none' : 'bg-white text-slate-800 shadow-sm rounded-tl-none'}
                                    `}>
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
