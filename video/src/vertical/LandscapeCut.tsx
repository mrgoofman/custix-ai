import React from "react";
import { FeedCut } from "./FeedCut";
import { LANDSCAPE } from "./layouts";

export const LandscapeCut: React.FC<{ withSound?: boolean; withMusic?: boolean }> = ({
  withSound = false,
  withMusic = false,
}) => <FeedCut layout={LANDSCAPE} withSound={withSound} withMusic={withMusic} />;
