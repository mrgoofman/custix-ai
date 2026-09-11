import React, { createContext, useContext } from "react";
import { T, type Timing } from "./timeline";

/**
 * Welche Frames gelten gerade? Der 16:9-Loop und der 9:16-Cut nutzen
 * dieselben Panels, aber unterschiedliche Timings.
 */
const TimingContext = createContext<Timing>(T);

export const TimingProvider = TimingContext.Provider;
export const useTiming = () => useContext(TimingContext);
