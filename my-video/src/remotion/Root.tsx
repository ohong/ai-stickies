import { Composition } from "remotion";
import { Main } from "./MyComp/Main";
import { AppDemo, appDemoSchema } from "./AppDemo/AppDemo";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";
import { Master } from "./AiStickiesDemo/Master";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoMain"
        component={Master}
        durationInFrames={2850}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
        schema={appDemoSchema}
        defaultProps={{
            title: "AI Stickies"
        }}
      />
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
    </>
  );
};
