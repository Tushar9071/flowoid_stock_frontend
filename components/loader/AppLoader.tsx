/**
 * @file AppLoader.tsx
 * @description Initial application loader with progress and status updates.
 */
"use client";

import React, { useEffect, useState } from "react";
import styles from "./AppLoader.module.css";

interface AppLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

const statuses = [
  "Initialising modules…",
  "Loading inventory data…",
  "Syncing with warehouse…",
  "Almost ready…"
];

export default function AppLoader({ onComplete, duration = 2600 }: AppLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "done" | "hidden">("loading");
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const delays = [
      { pct: 25, delay: 300 },
      { pct: 55, delay: 900 },
      { pct: 80, delay: 1600 },
      { pct: 100, delay: duration - 400 }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    delays.forEach(({ pct, delay }) => {
      timeouts.push(setTimeout(() => setProgress(pct), delay));
    });

    const statusDelays = [0, 700, 1400, 2100];
    statusDelays.forEach((delay, idx) => {
      timeouts.push(
        setTimeout(() => {
          setStatusIdx(Math.min(idx, statuses.length - 1));
        }, delay)
      );
    });

    timeouts.push(
      setTimeout(() => {
        setPhase("done");
        timeouts.push(
          setTimeout(() => {
            setPhase("hidden");
            if (onComplete) onComplete();
          }, 600)
        );
      }, duration)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [duration, onComplete]);

  if (phase === "hidden") return null;

  return (
    <div className={`${styles.overlay} ${phase === "done" ? styles.fadeOut : ""}`}>
      <div className={styles.logoBox}>
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="9" height="9" rx="2" fill="white" fillOpacity="1" />
          <rect x="13" y="2" width="9" height="9" rx="2" fill="white" fillOpacity="0.75" />
          <rect x="2" y="13" width="9" height="9" rx="2" fill="white" fillOpacity="0.75" />
          <rect x="13" y="13" width="9" height="9" rx="2" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
      <h1 className={styles.brandName}>Flowoid Stock</h1>
      <h2 className={styles.brandSub}>by Flowoid Technology</h2>
      
      <div className={styles.spinnerRing}></div>
      
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
      </div>
      
      <p className={styles.status}>{statuses[statusIdx]}</p>
      
      <div className={styles.dots}>
        <span className={styles.dot} style={{ animationDelay: "0s" }}></span>
        <span className={styles.dot} style={{ animationDelay: "0.18s" }}></span>
        <span className={styles.dot} style={{ animationDelay: "0.36s" }}></span>
      </div>

      <p className={styles.footer}>© 2025 Flowoid Technology. All rights reserved.</p>
    </div>
  );
}
