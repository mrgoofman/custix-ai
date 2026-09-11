import React from "react";
import { FeedCut } from "./FeedCut";
import { SQUARE } from "./layouts";

export const SquareCut: React.FC<{ withSound?: boolean; withMusic?: boolean }> = ({
  withSound = false,
  withMusic = false,
}) => <FeedCut layout={SQUARE} withSound={withSound} withMusic={withMusic} />;
