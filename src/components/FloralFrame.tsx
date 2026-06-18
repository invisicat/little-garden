import React from "react";

/**
 * A delicate baby's-breath frame — tiny soft white & pink florets scattered
 * around an element's edges. Sits behind the content as an airy decoration.
 * Placement is percentage-based so it adapts to any element size.
 */

type Spot = { x: number; y: number; r: number; s: number }; // x%, y%, rotate°, scale

// airy full frame — florets around all four edges, pointing outward
const FRAME_SPOTS: Spot[] = [
  // top
  { x: 15, y: 0, r: -16, s: 1 },
  { x: 39, y: -2, r: 10, s: 0.82 },
  { x: 62, y: -1, r: -8, s: 0.95 },
  { x: 86, y: 1, r: 18, s: 0.88 },
  // bottom
  { x: 13, y: 100, r: 172, s: 0.92 },
  { x: 38, y: 102, r: 196, s: 0.8 },
  { x: 64, y: 100, r: 178, s: 1 },
  { x: 88, y: 101, r: 200, s: 0.86 },
  // left
  { x: 0, y: 33, r: -104, s: 0.82 },
  { x: 1, y: 72, r: -74, s: 0.9 },
  // right
  { x: 100, y: 31, r: 102, s: 0.9 },
  { x: 99, y: 70, r: 76, s: 0.82 },
];

// lighter set for small pills — a floret near each corner
const CHIP_SPOTS: Spot[] = [
  { x: 7, y: 4, r: -128, s: 0.72 },
  { x: 93, y: 4, r: 128, s: 0.72 },
  { x: 9, y: 98, r: -158, s: 0.66 },
  { x: 91, y: 98, r: 158, s: 0.66 },
];

export function FloralFrame({ variant = "frame" }: { variant?: "frame" | "chip" }) {
  const spots = variant === "frame" ? FRAME_SPOTS : CHIP_SPOTS;
  return (
    <span className="floral-frame" aria-hidden="true">
      {spots.map((sp, i) => (
        <span
          key={i}
          className="floret"
          style={{
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            transform: `translate(-50%, -50%) rotate(${sp.r}deg) scale(${sp.s})`,
          }}
        >
          <Floret alt={i % 2 === 0} />
        </span>
      ))}
    </span>
  );
}

/** A little blossom cluster — just the soft white & pink petals, no stem. */
function Floret({ alt }: { alt: boolean }) {
  const a = alt ? "#ffffff" : "#f3b9d2";
  const b = alt ? "#f0b2cc" : "#ffffff";
  return (
    <svg width="21" height="21" viewBox="0 0 24 24">
      <circle cx="12" cy="8.5" r="2.3" fill={b} />
      <circle cx="8" cy="11" r="2.4" fill={a} />
      <circle cx="16" cy="11" r="2.4" fill={a} />
      <circle cx="10" cy="15" r="2.1" fill={b} />
      <circle cx="15" cy="15" r="2.1" fill={b} />
      <circle cx="12.2" cy="11.6" r="2.6" fill={a} />
      <circle cx="12.2" cy="11.6" r="1" fill="#ffe6f1" />
    </svg>
  );
}
