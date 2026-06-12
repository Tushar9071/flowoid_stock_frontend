/**
 * @file AppLoader.tsx
 * @description Initial application loader using an animated WebM splash video.
 */
"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./AppLoader.module.css";

interface AppLoaderProps {
  onComplete?: () => void;
  // duration targets 2.5s to match scaled video playback rate
  duration?: number;
}

export default function AppLoader({ onComplete, duration = 2500 }: AppLoaderProps) {
  const [phase, setPhase] = useState<"loading" | "done" | "hidden">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (videoRef.current) {
      // Speeds up the 5 second original animation to 2.5 seconds
      videoRef.current.playbackRate = 2.0;
    }

    let hideTimeout: NodeJS.Timeout;
    const finishTimeout = setTimeout(() => {
      setPhase("done");
      
      hideTimeout = setTimeout(() => {
        setPhase("hidden");
        if (onCompleteRef.current) onCompleteRef.current();
      }, 600); // 600ms matches the fadeOut animation
    }, duration);

    return () => {
      clearTimeout(finishTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [duration]);

  if (phase === "hidden") return null;

  return (
    <div className={`${styles.overlay} ${phase === "done" ? styles.fadeOut : ""}`}>
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          src="/animated_logo.mp4"
          className={styles.videoLoader}
          autoPlay
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
}
