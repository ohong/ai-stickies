import { AbsoluteFill, Series } from 'remotion';
import React from 'react';
import { z } from "zod";
import { ProblemScene } from './scenes/ProblemScene';
import { UploadScene } from './scenes/UploadScene';
import { SelectionScene } from './scenes/SelectionScene';
import { GenerationScene } from './scenes/GenerationScene';
import { ResultScene } from './scenes/ResultScene';
import { UsageScene } from './scenes/UsageScene';
import { Outro } from './scenes/Outro';

export const appDemoSchema = z.object({
	title: z.string(),
});

export const AppDemo: React.FC<z.infer<typeof appDemoSchema>> = () => {
  return (
    <AbsoluteFill className="bg-black">
        <Series>
            {/* 0:00 - 0:15: Problem (450 frames) */}
            <Series.Sequence durationInFrames={450}>
                <ProblemScene />
            </Series.Sequence>

            {/* 0:15 - 0:30: Upload (450 frames) */}
            <Series.Sequence durationInFrames={450}>
                <UploadScene />
            </Series.Sequence>

            {/* 0:30 - 0:45: Selection (450 frames) */}
            <Series.Sequence durationInFrames={450}>
                <SelectionScene />
            </Series.Sequence>

            {/* 0:45 - 0:55: Generation (300 frames) */}
            <Series.Sequence durationInFrames={300}>
                <GenerationScene />
            </Series.Sequence>

            {/* 0:55 - 1:10: Result (450 frames) */}
            <Series.Sequence durationInFrames={450}>
                <ResultScene />
            </Series.Sequence>

            {/* 1:10 - 1:20: Usage (300 frames) */}
            <Series.Sequence durationInFrames={300}>
                <UsageScene />
            </Series.Sequence>

            {/* 1:20 - 1:30: Outro (300 frames) */}
            <Series.Sequence durationInFrames={300}>
                <Outro />
            </Series.Sequence>
        </Series>
    </AbsoluteFill>
  );
};
