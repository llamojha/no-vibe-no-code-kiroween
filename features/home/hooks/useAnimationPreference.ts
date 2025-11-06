"use client";

import { useState, useEffect, useCallback } from "react";

export type AnimationMode = "normal" | "spooky";

interface AnimationPreference {
  mode: AnimationMode;
  lastUpdated: string;
}

const STORAGE_KEY = "animation-preference";
const DEFAULT_MODE: AnimationMode = "normal";

export const useAnimationPreference = () => {
  const [mode, setMode] = useState<AnimationMode>(DEFAULT_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const preference: AnimationPreference = JSON.parse(stored);
        setMode(preference.mode);
      }
    } catch (error) {
      console.warn(
        "Failed to load animation preference from localStorage:",
        error
      );
      // Fallback to default mode
      setMode(DEFAULT_MODE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preference to localStorage
  const savePreference = useCallback((newMode: AnimationMode) => {
    try {
      const preference: AnimationPreference = {
        mode: newMode,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.warn(
        "Failed to save animation preference to localStorage:",
        error
      );
    }
  }, []);

  // Toggle between modes
  const toggleMode = useCallback(() => {
    const newMode: AnimationMode = mode === "normal" ? "spooky" : "normal";
    setMode(newMode);
    savePreference(newMode);
  }, [mode, savePreference]);

  // Set specific mode
  const setAnimationMode = useCallback(
    (newMode: AnimationMode) => {
      if (newMode !== mode) {
        setMode(newMode);
        savePreference(newMode);
      }
    },
    [mode, savePreference]
  );

  return {
    mode,
    isLoading,
    toggleMode,
    setAnimationMode,
  };
};
