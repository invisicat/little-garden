import React, { useEffect, useMemo } from "react";
import { TodayPlot } from "./TodayPlot";
import { PlantFromEntry } from "./PlantSVG";
import { WildCluster, Bouquet } from "./Florets";
import { FloralFrame } from "./FloralFrame";
import type { Entry, Prefs } from "../lib/db";
import { MOODS } from "../lib/mood";
import {
  currentStreak,
  greeting,
  isToday,
  monthLabel,
  seasonOfKey,
  shortDate,
  weekday,
  type Season,
} from "../lib/date";

const MILESTONES = [7, 14, 30, 60, 100, 150, 200, 300, 365, 500, 730, 1000];

type Props = {
  entries: Entry[];
  prefs: Prefs;
  loaded: boolean;
  onPlantToday: () => void;
  onOpenDay: (date: string) => void;
  onOpenSettings: () => void;
  onSeasonChange?: (s: Season) => void;
};

const ROW_H = 138;
const MARKER_H = 88;

export function Garden({
  entries,
  prefs,
  loaded,
  onPlantToday,
  onOpenDay,
  onOpenSettings,
  onSeasonChange,
}: Props) {
  const keys = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const streak = currentStreak(keys);
  const loggedToday = entries.some((e) => isToday(e.date));
  const milestone = MILESTONES.includes(streak);

  // past plants (today is handled by the plot up top), laid out month by month
  const past = entries.filter((e) => !isToday(e.date));
  const layout = useMemo(() => buildLayout(past), [past]);

  const name = prefs.name.trim();

  // report the season currently in view, so the sky & weather can shift to match
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = window.innerHeight * 0.4;
        let best: Element | null = null;
        let bestDist = Infinity;
        document.querySelectorAll("[data-season]").forEach((el) => {
          const r = el.getBoundingClientRect();
          const c = r.top + r.height / 2;
          const d = Math.abs(c - mid);
          if (d < bestDist) {
            bestDist = d;
            best = el;
          }
        });
        const s = (best?.getAttribute("data-season") as Season | null) ?? null;
        onSeasonChange?.(s ?? "summer");
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [layout, onSeasonChange]);

  return (
    <main className="scroll garden">
      <header className="garden__head">
        <button
          className="gear"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <GearIcon />
        </button>
        <p className="eyebrow garden__hello">
          {greeting()}
          {name ? `, ${name}` : ""}
        </p>
        <h1 className="garden__title">
          {streak > 0 ? (
            <>
              your garden is
              <br />
              <em>{streak} day{streak === 1 ? "" : "s"} grown</em>
            </>
          ) : (
            <>
              let's grow
              <br />
              <em>something today</em>
            </>
          )}
        </h1>
        {streak > 0 && !milestone && (
          <p className="garden__sub">
            {loggedToday
              ? "today is planted — come back tomorrow 🌱"
              : "you're on a streak, keep it tender"}
          </p>
        )}
        {milestone && (
          <div className="bouquet-badge">
            <Bouquet />
            <div className="bouquet-badge__text">
              <span className="bouquet-badge__big">a {streak}-day bouquet!</span>
              <span className="bouquet-badge__small">gathered from everything you've grown 💐</span>
            </div>
          </div>
        )}
      </header>

      <div data-season={seasonOfKey(new Date().toISOString().slice(0, 10))}>
        <TodayPlot
          entry={entries.find((e) => isToday(e.date))}
          onPlant={onPlantToday}
          onOpen={onOpenDay}
        />
      </div>

      {!loaded ? null : past.length === 0 ? (
        <EmptyGarden />
      ) : (
        <section className="path" style={{ height: `${layout.height}px` }}>
          <svg
            className="path__trail"
            viewBox={`0 0 100 ${layout.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={layout.trail} className="path__line" />
          </svg>

          {layout.clusters.map((c, k) => (
            <span
              className="cluster"
              key={`c${k}`}
              style={{ top: `${c.y}px`, left: `${c.x}%` }}
            >
              <WildCluster season={c.season} seed={c.seed} />
            </span>
          ))}

          {layout.items.map((it) =>
            it.type === "marker" ? (
              <div
                className="month-marker"
                key={`m-${it.key}`}
                style={{ top: `${it.y}px` }}
                data-season={seasonOfKey(it.key + "-01")}
              >
                <FloralFrame variant="sign" seed={it.key} />
                <span className="month-marker__leaf" aria-hidden="true">
                  <MarkerSprig />
                </span>
                <span className="month-marker__name">{it.label}</span>
                <span className="month-marker__count">
                  {it.count} {it.count === 1 ? "day" : "days"} grown
                </span>
              </div>
            ) : (
              <button
                key={it.entry.date}
                className={`node node--${it.side}`}
                style={{ top: `${it.y}px`, left: `${it.side === "left" ? 30 : 70}%` }}
                onClick={() => onOpenDay(it.entry.date)}
                aria-label={`${weekday(it.entry.date)} ${shortDate(it.entry.date)} — open`}
                data-season={seasonOfKey(it.entry.date)}
              >
                <span className="node__plant">
                  <PlantFromEntry entry={it.entry} />
                </span>
                <span className="node__tag">
                  <span className="node__date">{shortDate(it.entry.date)}</span>
                  <span className="node__mood" style={{ color: MOODS[it.entry.mood].bloom }}>
                    {MOODS[it.entry.mood].label}
                  </span>
                </span>
              </button>
            ),
          )}
        </section>
      )}
    </main>
  );
}

function EmptyGarden() {
  return (
    <div className="empty">
      <div className="empty__soil" aria-hidden="true">
        <span className="empty__seed" />
      </div>
      <p className="empty__title">your garden is just soil right now</p>
      <p className="empty__sub">plant your first day and watch it grow.</p>
    </div>
  );
}

type LayoutItem =
  | { type: "marker"; key: string; label: string; count: number; y: number }
  | { type: "plant"; entry: Entry; y: number; side: "left" | "right" };

type Cluster = { x: number; y: number; season: Season; seed: number };

type Layout = { items: LayoutItem[]; clusters: Cluster[]; trail: string; height: number };

function seed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Lay the garden out month by month: a sign marks where each month begins,
 * then that month's days alternate down the winding trail. Wildflower
 * clusters tuck into the gaps as ambient filler.
 */
function buildLayout(past: Entry[]): Layout {
  const counts = new Map<string, number>();
  for (const e of past) {
    const mk = e.date.slice(0, 7);
    counts.set(mk, (counts.get(mk) ?? 0) + 1);
  }

  const items: LayoutItem[] = [];
  const clusters: Cluster[] = [];
  const pts: [number, number][] = [[50, 12]];
  let y = 16;
  let prevMonth: string | null = null;
  let pi = 0;
  let prevPlantY = 16;

  for (const e of past) {
    const mk = e.date.slice(0, 7);
    if (mk !== prevMonth) {
      items.push({
        type: "marker",
        key: mk,
        label: monthLabel(e.date),
        count: counts.get(mk) ?? 0,
        y: y + MARKER_H / 2,
      });
      y += MARKER_H;
      prevMonth = mk;
    }
    const side: "left" | "right" = pi % 2 === 0 ? "left" : "right";
    const py = y + ROW_H / 2;
    items.push({ type: "plant", entry: e, y: py, side });
    pts.push([side === "left" ? 30 : 70, py]);

    // tuck a wildflower cluster on the opposite side of some plants
    const s = seed(e.date);
    if (pi > 0 && s % 10 < 4) {
      clusters.push({
        x: side === "left" ? 68 : 18,
        y: (py + prevPlantY) / 2,
        season: seasonOfKey(e.date),
        seed: s,
      });
    }

    prevPlantY = py;
    y += ROW_H;
    pi++;
  }
  pts.push([50, y]);
  return { items, clusters, trail: smoothPath(pts), height: y + 16 };
}

/** A gentle vertical S-curve through a list of points. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const my = (y0 + y1) / 2;
    d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
  }
  return d;
}

function MarkerSprig() {
  return (
    <svg viewBox="0 0 24 16" width="26" height="17" fill="none" aria-hidden="true">
      <path d="M12 16 V7" stroke="var(--stem)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10 Q19 8 22 3 Q15 4 12 10 Z" fill="var(--stem-bright)" />
      <path d="M12 11 Q5 9 2 4 Q9 5 12 11 Z" fill="var(--stem-bright)" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7 5.3 5.3" />
    </svg>
  );
}
