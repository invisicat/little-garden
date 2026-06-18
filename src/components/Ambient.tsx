import React, { useMemo } from "react";
import type { Season } from "../lib/date";

const COUNT = 16;

/**
 * The weather of the season you're looking at: a faint color wash over the sky
 * plus drifting particles — snow in winter, petals in spring, leaves in autumn,
 * warm motes in summer. Purely ambient; hidden when reduced motion is preferred.
 */
export function Ambient({ season }: { season: Season }) {
  const motes = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const r = (n: number) => {
          const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return ((v % 1) + 1) % 1;
        };
        return {
          left: r(1) * 100,
          delay: -r(2) * 16,
          dur: 9 + r(3) * 11,
          size: 0.6 + r(4) * 1,
          drift: (r(5) - 0.5) * 80,
        };
      }),
    [],
  );

  return (
    <div className={`ambient ambient--${season}`} aria-hidden="true">
      <div className="season-wash" />
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={
            {
              left: `${m.left}%`,
              "--delay": `${m.delay}s`,
              "--dur": `${m.dur}s`,
              "--size": m.size,
              "--drift": `${m.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
