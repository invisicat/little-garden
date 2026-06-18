import React from "react";

/**
 * A delicate baby's-breath corner accent — soft white & pink blossom clusters
 * (no stems) tucked at an element's corners. Each floret picks a random-but-
 * stable variant from a `seed`, so they look hand-scattered without flickering.
 */

type Variant = "sign" | "chip";

const CORNERS = [
  { x: 6, y: 5, r: -130 },
  { x: 94, y: 5, r: 130 },
  { x: 7, y: 96, r: -150 },
  { x: 93, y: 96, r: 150 },
];

const BASE_SCALE: Record<Variant, number> = { sign: 1.55, chip: 0.95 };

// little stable hash → pseudo-random
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function FloralFrame({ variant = "sign", seed = "" }: { variant?: Variant; seed?: string }) {
  const base = BASE_SCALE[variant];
  return (
    <span className="floral-frame" aria-hidden="true">
      {CORNERS.map((c, i) => {
        const h = hash(`${seed}:${i}`);
        const kind = h % FLORET_KINDS.length;
        const alt = ((h >> 4) & 1) === 0;
        const scale = base * (0.85 + (((h >> 5) % 36) / 36) * 0.35); // ±
        const rot = c.r + (((h >> 9) % 34) - 17);
        return (
          <span
            key={i}
            className="floret"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
            }}
          >
            <Floret kind={kind} alt={alt} />
          </span>
        );
      })}
    </span>
  );
}

type Dot = { x: number; y: number; r: number; c: "w" | "p" | "c" };

// a handful of stemless blossom-cluster arrangements, centered on (12,12)
const FLORET_KINDS: Dot[][] = [
  // round puff
  [
    { x: 12, y: 8.5, r: 2.3, c: "p" },
    { x: 8, y: 11, r: 2.4, c: "w" },
    { x: 16, y: 11, r: 2.4, c: "w" },
    { x: 10, y: 15, r: 2.1, c: "p" },
    { x: 15, y: 15, r: 2.1, c: "p" },
    { x: 12.2, y: 11.6, r: 2.6, c: "w" },
    { x: 12.2, y: 11.6, r: 1, c: "c" },
  ],
  // small trio
  [
    { x: 9.5, y: 11, r: 2.6, c: "w" },
    { x: 15, y: 10.5, r: 2.3, c: "p" },
    { x: 12, y: 15, r: 2.4, c: "w" },
    { x: 12, y: 12, r: 0.9, c: "c" },
  ],
  // fuller bunch
  [
    { x: 12, y: 7.5, r: 2.2, c: "w" },
    { x: 7.5, y: 10, r: 2.3, c: "p" },
    { x: 16.5, y: 10, r: 2.3, c: "p" },
    { x: 9, y: 14.5, r: 2.2, c: "w" },
    { x: 15, y: 14.5, r: 2.2, c: "w" },
    { x: 12, y: 12.5, r: 2.5, c: "p" },
    { x: 12, y: 17, r: 1.9, c: "w" },
    { x: 12, y: 12, r: 0.9, c: "c" },
  ],
  // loose pair + buds
  [
    { x: 10, y: 10, r: 2.7, c: "w" },
    { x: 15.5, y: 13, r: 2.4, c: "p" },
    { x: 12, y: 16, r: 1.7, c: "w" },
    { x: 8, y: 14, r: 1.5, c: "p" },
    { x: 10, y: 10, r: 1, c: "c" },
  ],
  // tiny scatter
  [
    { x: 11, y: 9, r: 2, c: "p" },
    { x: 14.5, y: 11, r: 2.3, c: "w" },
    { x: 10, y: 13.5, r: 2.2, c: "w" },
    { x: 14, y: 15, r: 1.8, c: "p" },
  ],
];

function Floret({ kind, alt }: { kind: number; alt: boolean }) {
  const w = alt ? "#ffffff" : "#f3b9d2";
  const p = alt ? "#f0b2cc" : "#ffffff";
  return (
    <svg width="21" height="21" viewBox="0 0 24 24">
      {FLORET_KINDS[kind].map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={d.c === "w" ? w : d.c === "p" ? p : "#ffe6f1"}
        />
      ))}
    </svg>
  );
}
