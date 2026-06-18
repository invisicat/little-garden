import React, { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const BLOOMS = ["#f4a93c", "#e8705b", "#e891b0", "#8c9ae0", "#f5d06b"];

/**
 * A little shower of petals that lifts and scatters once — played over the
 * entry sheet the moment a day is planted. Ambient celebration, nothing more;
 * sits behind nothing it can block (pointer-events: none) and bows out for
 * reduced-motion.
 */
export function PetalBurst() {
  const reduce = useReducedMotion();
  const petals = useMemo(() => {
    const rand = (i: number, n: number) => {
      const v = Math.sin(i * 37.13 + n * 91.7) * 43758.5453;
      return ((v % 1) + 1) % 1;
    };
    return Array.from({ length: 16 }, (_, i) => {
      const spread = (i / 16) * Math.PI * 2;
      const dist = 80 + rand(i, 1) * 90;
      return {
        x: Math.cos(spread) * dist * (0.7 + rand(i, 4) * 0.6),
        y: -Math.abs(Math.sin(spread)) * dist - 30 - rand(i, 2) * 70,
        rot: (rand(i, 3) - 0.5) * 540,
        color: BLOOMS[i % BLOOMS.length],
        delay: rand(i, 5) * 0.12,
        dur: 0.95 + rand(i, 6) * 0.6,
        size: 9 + rand(i, 7) * 7,
      };
    });
  }, []);

  if (reduce) return null;

  return (
    <div className="petal-burst" aria-hidden="true">
      {petals.map((p, i) => (
        <motion.span
          key={i}
          className="petal-bit"
          style={{ background: p.color, width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1, 1, 0.85],
            rotate: p.rot,
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: [0.22, 0.7, 0.3, 1],
            times: [0, 0.18, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}
