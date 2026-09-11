import React from "react";
import { Composition } from "remotion";
import { HeroLoop } from "./HeroLoop";
import { LinkedInCut } from "./vertical/LinkedInCut";
import { SquareCut } from "./vertical/SquareCut";
import { LandscapeCut } from "./vertical/LandscapeCut";
import { FPS, DURATION } from "./timeline";
import { VDURATION } from "./vertical/timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="HeroLoop"
      component={HeroLoop}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="LinkedInCut"
      component={LinkedInCut}
      defaultProps={{ withSound: false, withMusic: false }}
      durationInFrames={VDURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="SquareCut"
      component={SquareCut}
      defaultProps={{ withSound: false, withMusic: false }}
      durationInFrames={VDURATION}
      fps={FPS}
      width={1080}
      height={1080}
    />
    <Composition
      id="LandscapeCut"
      component={LandscapeCut}
      defaultProps={{ withSound: false, withMusic: false }}
      durationInFrames={VDURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
