import { Composition } from "remotion";
import { AIStickiesTrailer } from "./Trailer";

// 9 scenes: 8+6+12+10+12+8+16+8+10 = 90s = 2700 frames
// 8 transitions at 12 frames = 96 frames subtracted
// Total: 2700 - 96 = 2604 frames (~86.8 seconds)
export const RemotionRoot = () => {
  return (
    <Composition
      id="AIStickiesTrailer"
      component={AIStickiesTrailer}
      durationInFrames={2604}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
