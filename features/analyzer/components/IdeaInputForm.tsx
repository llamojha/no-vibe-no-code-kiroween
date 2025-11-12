"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { requestTranscription } from "@/features/analyzer/api/transcribeAudio";
import { trackIdeaEnhancement } from "@/features/analytics/tracking";

interface IdeaInputFormProps {
  idea: string;
  onIdeaChange: (idea: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  analysisType?: "startup" | "kiroween";
}

type RecordingStatus = "idle" | "recording" | "transcribing" | "error";

const IdeaInputForm: React.FC<IdeaInputFormProps> = ({
  idea,
  onIdeaChange,
  onAnalyze,
  isLoading,
  analysisType = "startup",
}) => {
  const { t, locale } = useLocale();
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const previousIdeaRef = useRef<string>(idea);
  const modificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetRecording = useCallback((stream?: MediaStream) => {
    setRecordingStatus("idle");
    audioChunksRef.current = [];
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  // Track idea modifications with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (modificationTimeoutRef.current) {
      clearTimeout(modificationTimeoutRef.current);
    }

    // Don't track if idea is empty or hasn't changed
    if (!idea) {
      previousIdeaRef.current = idea;
      return;
    }

    if (idea === previousIdeaRef.current) {
      return;
    }

    // Debounce tracking to avoid tracking every keystroke
    modificationTimeoutRef.current = setTimeout(() => {
      const previousLength = previousIdeaRef.current.length;
      const currentLength = idea.length;
      const changeType =
        currentLength > previousLength ? "addition" : "deletion";

      trackIdeaEnhancement({
        action: "modify_idea",
        analysisType,
        suggestionLength: Math.abs(currentLength - previousLength),
        changeType,
      });

      previousIdeaRef.current = idea;
    }, 2000); // Wait 2 seconds after user stops typing

    return () => {
      if (modificationTimeoutRef.current) {
        clearTimeout(modificationTimeoutRef.current);
      }
    };
  }, [idea, analysisType]);

  const handleMicClick = useCallback(async () => {
    if (recordingStatus === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (recordingStatus === "transcribing") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setRecordingStatus("transcribing");
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(",")[1];
            const mimeType = audioBlob.type;
            const transcribedText = await requestTranscription(
              base64Audio,
              mimeType,
              locale
            );
            onIdeaChange(transcribedText);
          } catch (error) {
            console.error("Transcription error:", error);
            setRecordingStatus("error");
            setTimeout(() => setRecordingStatus("idle"), 3000);
          } finally {
            resetRecording(stream);
          }
        };
      };

      mediaRecorderRef.current.start();
      setRecordingStatus("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setRecordingStatus("error");
      setTimeout(() => setRecordingStatus("idle"), 3000);
    }
  }, [locale, onIdeaChange, recordingStatus, resetRecording]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onAnalyze();
    },
    [onAnalyze]
  );

  const getMicButton = () => {
    let icon: React.ReactNode;
    let tooltip: string;

    switch (recordingStatus) {
      case "recording":
        icon = (
          <svg
            className="w-6 h-6 text-red-500 animate-pulse"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" />
          </svg>
        );
        tooltip = t("stopRecordingTooltip");
        break;
      case "transcribing":
        icon = (
          <div className="w-6 h-6 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
        tooltip = t("transcribingTooltip");
        break;
      case "error":
        icon = (
          <svg
            className="w-6 h-6 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
        tooltip = "Error";
        break;
      default:
        icon = (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        );
        tooltip = t("recordIdeaTooltip");
    }

    return (
      <button
        type="button"
        onClick={handleMicClick}
        title={tooltip}
        aria-label={tooltip}
        className="absolute bottom-3 right-4 p-2 rounded-md bg-primary/50 text-slate-400 hover:bg-accent/20 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
        disabled={isLoading || recordingStatus === "transcribing"}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="bg-primary/50 backdrop-blur-sm p-6 rounded-none shadow-lg border border-accent/20 animate-slide-in-up relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-5" />
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="startup-idea"
          className="block text-lg font-semibold text-slate-300 mb-2 uppercase tracking-wider"
        >
          {t("formLabel")}
        </label>
        <div className="relative">
          <textarea
            id="startup-idea"
            data-testid="idea-input"
            rows={5}
            className="w-full p-3 pr-16 bg-black/50 border border-slate-700 rounded-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition duration-200 placeholder-slate-500 text-slate-100 font-mono"
            placeholder={t("formPlaceholder")}
            value={idea}
            onChange={(event) => onIdeaChange(event.target.value)}
            disabled={isLoading}
          />
          {getMicButton()}
        </div>
        <button
          type="submit"
          data-testid="analyze-button"
          disabled={isLoading || !idea.trim()}
          className="relative pointer-events-auto mt-4 w-full flex justify-center items-center px-6 py-3 border border-secondary text-base font-bold rounded-none text-white bg-secondary/20 hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-secondary disabled:bg-slate-700 disabled:border-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 uppercase tracking-widest group"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("analyzingButton")}
            </>
          ) : (
            <>
              <span className="relative pointer-events-none group-hover:animate-glitch">
                {t("analyzeButton")}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default IdeaInputForm;
