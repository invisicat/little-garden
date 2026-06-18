import React, { useMemo } from "react";
import { growPlant, intensityFromEntry, type BloomHead, type PlantParts } from "../lib/plant";
import type { Entry } from "../lib/db";
import type { MoodKey } from "../lib/mood";

type Props = {
  date: string;
  mood: MoodKey;
  intensity: number;
  /** extra flourishes — one bud per photo */
  accents?: number;
  /** plays the unfurl animation once on mount */
  grow?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** A single grown plant. Pure SVG, deterministic from (date, mood). */
export function PlantSVG({ date, mood, intensity, accents = 0, grow, className, style }: Props) {
  const p = useMemo<PlantParts>(
    () => growPlant({ seed: date, mood, intensity, accents }),
    [date, mood, intensity, accents],
  );

  return (
    <svg
      className={`plant ${grow ? "plant--grow" : ""} ${className ?? ""}`}
      viewBox={`0 0 ${p.viewW} ${p.viewH}`}
      style={{ ["--sway" as string]: `${p.sway}s`, ...style }}
      aria-hidden="true"
    >
      {/* a small soil mound */}
      <ellipse
        cx={p.viewW / 2}
        cy={p.groundY + 6}
        rx={26}
        ry={7}
        fill="var(--dew-deep)"
        opacity="0.8"
      />
      <g className="plant__body">
        <path
          d={p.stem}
          fill="none"
          stroke="var(--stem)"
          strokeWidth={p.stemWidth}
          strokeLinecap="round"
        />
        {p.branches.map((b, k) => (
          <path
            key={`br${k}`}
            d={b}
            fill="none"
            stroke="var(--stem)"
            strokeWidth={Math.max(2, p.stemWidth - 1)}
            strokeLinecap="round"
          />
        ))}
        {p.tendril && (
          <path
            d={p.tendril}
            fill="none"
            stroke={p.leafColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />
        )}
        {p.leaves.map((l, k) => (
          <path key={k} d={l.d} fill={k % 2 === 0 ? p.leafColor : p.leafColorAlt} opacity="0.94" />
        ))}
        {p.berries.map((b, k) => (
          <circle key={`y${k}`} cx={b.cx} cy={b.cy} r={b.r} fill={b.color} opacity="0.95" />
        ))}
        {p.buds.map((b, k) => (
          <circle key={`b${k}`} cx={b.cx} cy={b.cy} r={b.r} fill={b.color} opacity="0.85" />
        ))}
        <g className="plant__bloom">
          {p.blooms.map((b, k) => (
            <Bloom key={`fl${k}`} b={b} />
          ))}
        </g>
      </g>
    </svg>
  );
}

function Bloom({ b }: { b: BloomHead }) {
  return (
    <g>
      {b.petals.map((pt, k) => (
        <ellipse
          key={k}
          cx={pt.cx}
          cy={pt.cy}
          rx={pt.rx}
          ry={pt.ry}
          fill={b.color}
          transform={`rotate(${pt.rot} ${pt.cx} ${pt.cy})`}
          opacity="0.96"
        />
      ))}
      {b.kind !== "bud" && b.kind !== "bell" && (
        <circle cx={b.x} cy={b.y} r={4.5 * b.scale} fill={b.center} />
      )}
    </g>
  );
}

/** Convenience: grow a plant straight from a stored entry. */
export function PlantFromEntry({
  entry,
  grow,
  style,
}: {
  entry: Entry;
  grow?: boolean;
  style?: React.CSSProperties;
}) {
  const intensity = intensityFromEntry(entry.text.length, entry.photos.length);
  return (
    <PlantSVG
      date={entry.date}
      mood={entry.mood}
      intensity={intensity}
      accents={entry.photos.length}
      grow={grow}
      style={style}
    />
  );
}
