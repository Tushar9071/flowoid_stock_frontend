/**
 * @file PageLoader.tsx
 * @description Minimal horizontal top progress bar for page transitions.
 */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLoader } from "@/context/LoaderContext";
import styles from "./PageLoader.module.css";

export default function PageLoader() {
  const { pageLoading } = useLoader();
  const visible = pageLoading;
  const barRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!barRef.current) return;

    if (visible) {
      setOpacity(1);
      barRef.current.style.width = "0%";
      let w = 0;
      const interval = setInterval(() => {
        w = w < 85 ? w + (85 - w) * 0.08 : w;
        if (barRef.current) {
          barRef.current.style.width = `${w}%`;
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      barRef.current.style.width = "100%";
      const timeout = setTimeout(() => {
        setOpacity(0);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  return (
    <div className={styles.track} style={{ opacity, transition: "opacity 0.2s" }}>
      <div ref={barRef} className={styles.bar}>
        {visible && <div className={styles.glow} />}
      </div>
    </div>
  );
}
