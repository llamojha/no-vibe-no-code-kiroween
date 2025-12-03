"use client";

import React from "react";
import { AnimationMode } from "@/features/home/hooks/useAnimationPreference";
import BackgroundAnimationNormal from "./BackgroundAnimationNormal";
import BackgroundAnimationSpooky from "./BackgroundAnimationSpooky";

interface BackgroundAnimationProps {
  mode?: AnimationMode;
  className?: string;
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({
  mode = "normal",
  className = "absolute inset-0 z-0",
}) => {
  // Switch between normal and spooky animations based on mode
  if (mode === "spooky") {
    return <BackgroundAnimationSpooky className={className} />;
  }

  return <BackgroundAnimationNormal className={className} />;
};

export default BackgroundAnimation;
