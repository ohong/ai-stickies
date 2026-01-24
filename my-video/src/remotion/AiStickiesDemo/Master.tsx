import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig, interpolate, useCurrentFrame } from "remotion";
import { PhoneContainer } from "./PhoneContainer";
import { ChatInterface } from "./ChatInterface";
import { BrowserWindow } from "./BrowserWindow";
import { Outro } from "./Outro";
import { TextOverlay } from "./TextOverlay";

export const Master: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- TRANSITIONS ---
  // Frame 150: Phone fades out, Browser slides up
  const scene1Opacity = interpolate(frame, [140, 150], [1, 0]);
  const scene1Scale = interpolate(frame, [100, 150], [1, 0.8]);

  // Frame 2250: Browser fades out, Phone slides in
  const scene2Opacity = interpolate(frame, [2240, 2250], [1, 0]);

  // Frame 2550: Phone fades out, Outro appears
  const scene3Opacity = interpolate(frame, [2540, 2550], [1, 0]);

  return (
    <AbsoluteFill className="bg-gray-100">

      {/* === SCENE 1: THE PROBLEM (0-5s) === */}
      <Sequence from={0} durationInFrames={150}>
        <div style={{ opacity: scene1Opacity, transform: `scale(${scene1Scale})`, width: '100%', height: '100%' }}>
          <PhoneContainer>
            <ChatInterface mode="intro" />
          </PhoneContainer>
          <Sequence from={30}>
            <TextOverlay text="Tired of generic reactions?" />
          </Sequence>
        </div>
      </Sequence>

      {/* === SCENE 2: THE SOLUTION (5s-75s) === */}
      <Sequence from={150} durationInFrames={2100}>
        <div style={{ opacity: scene2Opacity, width: '100%', height: '100%' }}>
          <BrowserWindow /> {/* This contains the AppInterface logic */}
          
          {/* Text Overlays for Browser Section */}
          <Sequence from={30} durationInFrames={90}>
            <TextOverlay text="This is AI Stickies." />
          </Sequence>
          
          <Sequence from={150} durationInFrames={90}>
            <TextOverlay text="Turn your selfie into a sticker pack." />
          </Sequence>

          <Sequence from={750} durationInFrames={90}>
            <TextOverlay text="Choose your vibe." />
          </Sequence>

          <Sequence from={1200} durationInFrames={90}>
             <TextOverlay text="10 unique emotions." />
          </Sequence>
          
          <Sequence from={1850} durationInFrames={90}>
             <TextOverlay text="Ready for LINE." />
          </Sequence>

        </div>
      </Sequence>

      {/* === SCENE 3: THE PAYOFF (75s-85s) === */}
      <Sequence from={2250} durationInFrames={300}>
        <div style={{ opacity: scene3Opacity, width: '100%', height: '100%' }}>
          <PhoneContainer>
            <ChatInterface mode="payoff" />
          </PhoneContainer>
          <Sequence from={30}>
            <TextOverlay text="Be the main character." />
          </Sequence>
        </div>
      </Sequence>

      {/* === SCENE 4: OUTRO (85s-95s) === */}
      <Sequence from={2550} durationInFrames={300}>
        <Outro />
      </Sequence>

    </AbsoluteFill>
  );
};
