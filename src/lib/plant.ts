/* ============================================================
   plant.ts — the signature.
   A deterministic little plant grown from a day.

   Same inputs -> same plant, forever. The garden is the tracker,
   so every day must be its own recognizable shape.
   ============================================================ */

import { MOODS, type MoodKey } from "./mood";

export type BloomKind = "daisy" | "tulip" | "poppy" | "cluster" | "bell" | "bud";

export type Petal = { cx: number; cy: number; rx: number; ry: number; rot: number };

export type BloomHead = {
  kind: BloomKind;
  x: number;
  y: number;
  color: string;
  center: string;
  petals: Petal[];
  scale: number;
};

export type PlantParts = {
  viewW: number;
  viewH: number;
  groundY: number;
  stem: string; // path "d"
  stemWidth: number;
  branches: string[]; // little side-stems that hold extra blooms (a bunch)
  leaves: { d: string }[];
  leafColor: string;
  leafColorAlt: string;
  buds: { cx: number; cy: number; r: number; color: string }[];
  berries: { cx: number; cy: number; r: number; color: string }[];
  tendril: string | null; // a curling vine for the fullest days
  blooms: BloomHead[]; // one head normally; a bunch on full days
  sway: number; // animation offset seconds, 0..3
};

/* --- tiny deterministic PRNG (mulberry32 seeded by a string hash) --- */
function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLOOM_BY_MOOD: Record<MoodKey, BloomKind> = {
  radiant: "daisy",
  good: "tulip",
  tender: "bell",
  tired: "bud",
  stormy: "poppy",
};

export type GrowOpts = {
  /** the day, e.g. "2026-06-17" — drives the unique shape */
  seed: string;
  mood: MoodKey;
  /** how much was written, 0..1 — drives height & fullness */
  intensity: number;
  /** extra flourishes (e.g. one bud per photo added) */
  accents?: number;
  /** override bloom color; defaults to the mood's bloom */
  color?: string;
};

export function growPlant({ seed, mood, intensity, accents = 0, color }: GrowOpts): PlantParts {
  const rand = rng(hash(seed + ":" + mood));
  const i = clamp(intensity, 0, 1);

  const viewW = 120;
  const viewH = 170;
  const groundY = 150;
  const baseX = viewW / 2 + (rand() - 0.5) * 10;

  // taller stems for fuller days — a sparse day is a sprout, a full one reaches up
  const height = 46 + i * 92 + rand() * 12;
  const topX = baseX + (rand() - 0.5) * 40; // lean
  const topY = groundY - height;

  // a gentle S-curve stem
  const c1x = baseX + (rand() - 0.5) * 24;
  const c1y = groundY - height * 0.4;
  const c2x = topX + (rand() - 0.5) * 24;
  const c2y = groundY - height * 0.75;
  const stem = `M ${baseX} ${groundY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${topX} ${topY}`;
  const stemWidth = 3 + i * 1.6;

  // leaves climb the stem — the more you write, the leafier the day (2 → ~9)
  const leafCount = clampInt(Math.round(2 + i * 6.5 + rand()), 2, 9);
  const leaves: { d: string }[] = [];
  for (let n = 0; n < leafCount; n++) {
    const t = 0.18 + (n / Math.max(leafCount, 1)) * 0.66 + rand() * 0.04;
    const p = pointOnCubic(t, baseX, groundY, c1x, c1y, c2x, c2y, topX, topY);
    const side = n % 2 === 0 ? 1 : -1;
    const len = 15 + rand() * 12;
    const lift = 8 + rand() * 8;
    const tipX = p.x + side * len;
    const tipY = p.y - lift;
    const cx = p.x + side * len * 0.4;
    const cy = p.y - lift - 9;
    const cx2 = p.x + side * len * 0.5;
    const cy2 = p.y + 4;
    leaves.push({
      d: `M ${p.x} ${p.y} Q ${cx} ${cy} ${tipX} ${tipY} Q ${cx2} ${cy2} ${p.x} ${p.y} Z`,
    });
  }

  const bloomColor = color ?? MOODS[mood].bloom;

  // little side-buds: a fuller day sprouts more, and each photo adds one
  const budCount = clampInt(Math.round(Math.max(0, i - 0.35) * 5) + accents, 0, 6);
  const buds: { cx: number; cy: number; r: number; color: string }[] = [];
  for (let n = 0; n < budCount; n++) {
    const t = 0.5 + (n / Math.max(budCount, 1)) * 0.38 + rand() * 0.03;
    const p = pointOnCubic(t, baseX, groundY, c1x, c1y, c2x, c2y, topX, topY);
    const side = n % 2 === 0 ? -1 : 1;
    buds.push({
      cx: p.x + side * (8 + rand() * 5),
      cy: p.y - 2 - rand() * 4,
      r: 2.6 + rand() * 1.6,
      color: bloomColor,
    });
  }

  // seasonal foliage — leaves take on the color of the month they grew in
  const month = Number(seed.slice(5, 7)) || 6;
  const { leaf, leafAlt } = leafPalette(month);

  // berries & a curling vine are reserved for the fullest days — a big day earns flourishes
  const berries: { cx: number; cy: number; r: number; color: string }[] = [];
  const clusters = i > 0.92 ? 2 : i > 0.72 ? 1 : 0;
  for (let c = 0; c < clusters; c++) {
    const t = 0.45 + c * 0.22 + rand() * 0.06;
    const p = pointOnCubic(t, baseX, groundY, c1x, c1y, c2x, c2y, topX, topY);
    const side = c % 2 === 0 ? 1 : -1;
    const bx = p.x + side * (10 + rand() * 4);
    const by = p.y + 4;
    const berryColor = month >= 9 && month <= 11 ? "#C24A3E" : "#B5485F"; // rosehip in autumn
    for (let b = 0; b < 3; b++) {
      berries.push({
        cx: bx + (b - 1) * 3.4 + (rand() - 0.5) * 2,
        cy: by + Math.abs(b - 1) * 3 + rand() * 2,
        r: 2.4 + rand() * 0.8,
        color: berryColor,
      });
    }
  }

  let tendril: string | null = null;
  if (i > 0.7) {
    const tp = pointOnCubic(0.34 + rand() * 0.06, baseX, groundY, c1x, c1y, c2x, c2y, topX, topY);
    const dir = rand() > 0.5 ? 1 : -1;
    tendril =
      `M ${tp.x} ${tp.y} ` +
      `q ${dir * 11} -3 ${dir * 13} 5 ` +
      `q ${dir * 1.5} 7 ${-dir * 5} 7 ` +
      `q ${-dir * 5} 0 ${-dir * 2.5} -5.5`;
  }

  const kind = BLOOM_BY_MOOD[mood];
  const scale = 0.85 + i * 0.5 + rand() * 0.15;

  // a full day blooms into a little bunch — extra heads on short side-stems
  const blooms: BloomHead[] = [makeHead(kind, topX, topY, bloomColor, scale, rand)];
  const branches: string[] = [];
  const extraBlooms = i > 0.92 ? 2 : i > 0.78 ? 1 : 0;
  for (let n = 0; n < extraBlooms; n++) {
    const bt = 0.72 + rand() * 0.1;
    const bp = pointOnCubic(bt, baseX, groundY, c1x, c1y, c2x, c2y, topX, topY);
    const side = n % 2 === 0 ? 1 : -1;
    const hx = bp.x + side * (13 + rand() * 8);
    const hy = bp.y - (8 + rand() * 12);
    branches.push(`M ${bp.x} ${bp.y} Q ${bp.x + side * 8} ${bp.y - 11} ${hx} ${hy}`);
    blooms.push(makeHead(kind, hx, hy, bloomColor, scale * 0.66, rand));
  }

  return {
    viewW,
    viewH,
    groundY,
    stem,
    stemWidth,
    branches,
    leaves,
    leafColor: leaf,
    leafColorAlt: leafAlt,
    buds,
    berries,
    tendril,
    blooms,
    sway: rand() * 2.4,
  };
}

function makeHead(
  kind: BloomKind,
  x: number,
  y: number,
  color: string,
  scale: number,
  rand: () => number,
): BloomHead {
  return { kind, x, y, color, ...buildBloom(kind, x, y, color, scale, rand) };
}

/** Leaf colors by month — spring green, summer deep, autumn gold, winter sage. */
function leafPalette(month: number): { leaf: string; leafAlt: string } {
  if (month >= 3 && month <= 5) return { leaf: "#7FB069", leafAlt: "#9AC471" }; // spring
  if (month >= 6 && month <= 8) return { leaf: "#5C8A4E", leafAlt: "#6FA85C" }; // summer
  if (month >= 9 && month <= 11) return { leaf: "#D08A38", leafAlt: "#C2683A" }; // autumn
  return { leaf: "#8FA98C", leafAlt: "#A9BCA2" }; // winter
}

function buildBloom(
  kind: BloomKind,
  x: number,
  y: number,
  color: string,
  scale: number,
  rand: () => number,
): { center: string; petals: Petal[]; scale: number } {
  const petals: Petal[] = [];
  const center = centerColor(color);

  if (kind === "daisy") {
    const n = 8 + Math.floor(rand() * 4);
    const r = 11 * scale;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      petals.push({
        cx: x + Math.cos(a) * r,
        cy: y + Math.sin(a) * r,
        rx: 7 * scale,
        ry: 4 * scale,
        rot: (a * 180) / Math.PI,
      });
    }
  } else if (kind === "poppy") {
    const n = 5;
    const r = 9 * scale;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rand() * 0.3;
      petals.push({
        cx: x + Math.cos(a) * r,
        cy: y + Math.sin(a) * r,
        rx: 10 * scale,
        ry: 9 * scale,
        rot: (a * 180) / Math.PI,
      });
    }
  } else if (kind === "tulip") {
    for (let k = -1; k <= 1; k++) {
      petals.push({
        cx: x + k * 6 * scale,
        cy: y,
        rx: 6 * scale,
        ry: 12 * scale,
        rot: k * 12,
      });
    }
  } else if (kind === "bell") {
    for (let k = 0; k < 3; k++) {
      petals.push({
        cx: x + (k - 1) * 7 * scale,
        cy: y + 2 * scale,
        rx: 5.5 * scale,
        ry: 8 * scale,
        rot: (k - 1) * 18,
      });
    }
  } else if (kind === "cluster") {
    for (let k = 0; k < 6; k++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * 8 * scale;
      petals.push({
        cx: x + Math.cos(a) * r,
        cy: y + Math.sin(a) * r,
        rx: 3.5 * scale,
        ry: 3.5 * scale,
        rot: 0,
      });
    }
  } else {
    // bud — a small closed promise of a flower
    petals.push({ cx: x, cy: y, rx: 6 * scale, ry: 9 * scale, rot: 0 });
    petals.push({ cx: x - 2.5 * scale, cy: y + 1, rx: 4 * scale, ry: 7 * scale, rot: -16 });
    petals.push({ cx: x + 2.5 * scale, cy: y + 1, rx: 4 * scale, ry: 7 * scale, rot: 16 });
  }

  return { center, petals, scale };
}

/* --- helpers --- */
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function clampInt(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function pointOnCubic(
  t: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * x0 + w1 * x1 + w2 * x2 + w3 * x3,
    y: w0 * y0 + w1 * y1 + w2 * y2 + w3 * y3,
  };
}

function centerColor(petal: string): string {
  // a warm middle for most blooms
  const warm = ["#F4A93C", "#F5D06b", "#E8915A"];
  return warm[Math.abs(hashHex(petal)) % warm.length];
}
function hashHex(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Estimate writing intensity from an entry for plant fullness. */
export function intensityFromEntry(textLen: number, photoCount: number): number {
  const t = Math.min(textLen / 240, 1); // ~a couple sentences fills it
  const p = Math.min(photoCount / 3, 1);
  return clamp(t * 0.7 + p * 0.3, 0.1, 1);
}
