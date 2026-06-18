import React from "react";
import type { Season } from "../lib/date";

/** A tiny flower for calendar cells — just a colored bloom. */
export function MiniBloom({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="mini-bloom">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="12"
          cy="6.5"
          rx="3.4"
          ry="5"
          fill={color}
          transform={`rotate(${a} 12 12)`}
          opacity="0.95"
        />
      ))}
      <circle cx="12" cy="12" r="2.8" fill="#F5D06B" />
    </svg>
  );
}

const WILD_COLORS: Record<Season, string[]> = {
  spring: ["#E891B0", "#F5D06B", "#8C9AE0"],
  summer: ["#F4A93C", "#E8705B", "#E891B0"],
  autumn: ["#E8705B", "#F4A93C", "#C24A3E"],
  winter: ["#8C9AE0", "#CFE4E6", "#E891B0"],
};

/**
 * A small cluster of wildflowers tucked along the trail — ambient filler.
 * Deterministic shape from a seed so it stays put between renders.
 */
export function WildCluster({ season, seed }: { season: Season; seed: number }) {
  const colors = WILD_COLORS[season];
  const blades = [0, 1, 2, 3];
  // simple seeded jitter
  const j = (n: number) => (((seed * 9301 + n * 49297) % 233280) / 233280 - 0.5) * 2;
  const flowers = [0, 1, 2].map((n) => ({
    x: 14 + n * 11 + j(n) * 4,
    y: 12 + j(n + 5) * 5,
    c: colors[n % colors.length],
    r: 2.6 + Math.abs(j(n + 2)) * 1.2,
  }));
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden="true" className="wild-cluster">
      {blades.map((b) => (
        <path
          key={b}
          d={`M ${12 + b * 11} 40 Q ${12 + b * 11 + j(b) * 5} 24 ${12 + b * 11 + j(b) * 8} 16`}
          stroke="var(--stem)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.65"
        />
      ))}
      {flowers.map((f, k) => (
        <g key={k}>
          <path
            d={`M ${f.x} 40 Q ${f.x + j(k) * 4} ${f.y + 12} ${f.x} ${f.y}`}
            stroke="var(--stem)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          {[0, 90, 180, 270].map((a) => (
            <ellipse
              key={a}
              cx={f.x}
              cy={f.y - f.r}
              rx={f.r * 0.8}
              ry={f.r}
              fill={f.c}
              transform={`rotate(${a} ${f.x} ${f.y})`}
              opacity="0.9"
            />
          ))}
          <circle cx={f.x} cy={f.y} r={f.r * 0.55} fill="#F5D06B" />
        </g>
      ))}
    </svg>
  );
}

/** A gathered bunch — shown when a streak hits a milestone. */
export function Bouquet() {
  const stems = [
    { x: 26, c: "#E8705B" },
    { x: 34, c: "#F4A93C" },
    { x: 42, c: "#E891B0" },
    { x: 30, c: "#8C9AE0" },
    { x: 38, c: "#F5D06B" },
  ];
  return (
    <svg width="60" height="64" viewBox="0 0 68 72" aria-hidden="true" className="bouquet">
      {/* stems gathered at a wrap */}
      {stems.map((s, k) => (
        <path
          key={`s${k}`}
          d={`M 34 60 Q ${(34 + s.x) / 2} 40 ${s.x} ${20 - (k % 2) * 4}`}
          stroke="var(--stem)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {/* paper wrap */}
      <path d="M22 58 L34 44 L46 58 L40 70 L28 70 Z" fill="#FBF9F2" stroke="#e3ddcb" strokeWidth="1.5" />
      <path d="M34 60 L34 70" stroke="#e3ddcb" strokeWidth="1.2" />
      {/* flower heads */}
      {stems.map((s, k) => {
        const y = 18 - (k % 2) * 4;
        return (
          <g key={`f${k}`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx={s.x}
                cy={y - 5}
                rx="3"
                ry="4.5"
                fill={s.c}
                transform={`rotate(${a} ${s.x} ${y})`}
              />
            ))}
            <circle cx={s.x} cy={y} r="2.4" fill="#F5D06B" />
          </g>
        );
      })}
    </svg>
  );
}
