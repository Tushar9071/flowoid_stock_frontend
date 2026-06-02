/**
 * @file Skeletons.tsx
 * @description Professional skeleton loading components for various UI elements.
 */
"use client";

import React from "react";
import styles from "./Skeletons.module.css";

interface BoxProps {
  w?: string | number;
  h?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Box = ({ w = "100%", h = 20, radius = 4, className = "", style }: BoxProps) => (
  <div
    className={`${styles.shimmer} ${className}`}
    style={{ width: w, height: h, borderRadius: radius, ...style }}
  />
);

const WIDTH_STEPS = ["42%", "58%", "66%", "74%", "53%", "61%", "48%", "69%"];

function rowWidth(rowIndex: number, colIndex: number) {
  return WIDTH_STEPS[(rowIndex + colIndex) % WIDTH_STEPS.length];
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHead} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Box key={`th-${i}`} w="70%" h={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`tr-${r}`} className={styles.tableRow} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => {
            if (c === cols - 1) {
              return <Box key={`td-${r}-${c}`} w={60} h={20} radius={20} style={{ justifySelf: "end" }} />;
            }
            return <Box key={`td-${r}-${c}`} w={rowWidth(r, c)} h={14} />;
          })}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.cardGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-${i}`} className={styles.card}>
          <Box w={55} h={11} className={styles.cardLabel} style={{ marginBottom: 12 }} />
          <Box w={90} h={26} className={styles.cardValue} style={{ marginBottom: 8 }} />
          <Box w={70} h={10} className={styles.cardSub} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.listWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`list-${i}`} className={styles.listRow}>
          <Box w={36} h={36} radius="50%" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Box w="40%" h={14} />
            <Box w="25%" h={10} />
          </div>
          <Box w={60} h={20} radius={20} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box w={150} h={24} />
        <Box w={100} h={36} radius={8} />
      </div>
      <SkeletonCard count={4} />
      <div className={styles.chartBox} style={{ background: "#f7f7f7", padding: 24, borderRadius: 14, border: "1px solid #dfdfdf" }}>
        <Box w={120} h={16} style={{ marginBottom: 24 }} />
        <div className={styles.chartBars}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Box key={`bar-${i}`} className={styles.bar} h={`${40 + ((i * 11) % 55)}%`} />
          ))}
        </div>
      </div>
      <SkeletonTable />
    </div>
  );
}

export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className={styles.formWrap} style={{ background: "#f7f7f7", padding: 24, borderRadius: 14, border: "1px solid #dfdfdf", maxWidth: 600 }}>
      <Box w={180} h={20} style={{ marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={`field-${i}`}>
            <Box w={80} h={12} style={{ marginBottom: 8 }} />
            <Box w="100%" h={38} radius={6} />
          </div>
        ))}
        <Box w={120} h={38} radius={6} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonDashboardPage() {
  return (
    <div className={styles.pageScaffold}>
      <div className={styles.heroBlock}>
        <Box w="26%" h={22} style={{ marginBottom: 12 }} />
        <Box w="44%" h={12} />
      </div>
      <SkeletonCard count={4} />
      <div className={styles.splitGrid}>
        <div className={styles.stackCard}>
          <Box w="30%" h={16} style={{ marginBottom: 14 }} />
          <div style={{ display: "grid", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={`dash-list-${i}`} w={rowWidth(i, 1)} h={12} />
            ))}
          </div>
        </div>
        <div className={styles.stackCard}>
          <Box w="40%" h={16} style={{ marginBottom: 14 }} />
          <SkeletonList count={4} />
        </div>
      </div>
      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}

export function SkeletonAdminPage() {
  return (
    <div className={styles.pageScaffold}>
      <div className={styles.heroBlock}>
        <Box w="22%" h={20} style={{ marginBottom: 10 }} />
        <Box w="36%" h={12} />
      </div>
      <SkeletonCard count={4} />
      <SkeletonTable rows={8} cols={6} />
      <div className={styles.splitGrid}>
        <div className={styles.stackCard}>
          <Box w="28%" h={16} style={{ marginBottom: 12 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={`admin-metric-${i}`} w={rowWidth(i, 2)} h={12} style={{ marginBottom: 8 }} />
          ))}
        </div>
        <div className={styles.stackCard}>
          <Box w="35%" h={16} style={{ marginBottom: 12 }} />
          <SkeletonList count={5} />
        </div>
      </div>
    </div>
  );
}

export default {
  SkeletonTable,
  SkeletonCard,
  SkeletonList,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonDashboardPage,
  SkeletonAdminPage,
};
