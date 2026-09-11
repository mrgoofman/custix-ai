import React from "react";
import { FeedCut } from "./FeedCut";
import { PORTRAIT } from "./layouts";

export const LinkedInCut: React.FC<{ withSound?: boolean; withMusic?: boolean }> = ({
  withSound = false,
  withMusic = false,
}) => <FeedCut layout={PORTRAIT} withSound={withSound} withMusic={withMusic} />;
