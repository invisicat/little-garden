import React, { useState } from "react";
import { MiniBloom } from "./Florets";
import { MOODS } from "../lib/mood";
import type { Entry } from "../lib/db";
import {
  addMonth,
  DOW_SHORT,
  isFuture,
  isToday,
  monthGrid,
  monthLabel,
  thisMonthKey,
  type Season,
  seasonOfKey,
} from "../lib/date";

type Props = {
  entries: Entry[];
  onOpenDay: (date: string) => void;
  onPlantDate: (date: string) => void;
  onSeasonChange?: (s: Season) => void;
};

/** A month grid — each logged day wears its bloom. Tap a past empty day to backfill it. */
export function Calendar({ entries, onOpenDay, onPlantDate, onSeasonChange }: Props) {
  const [month, setMonth] = useState(() => thisMonthKey());
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const cells = monthGrid(month);
  const atCurrent = month >= thisMonthKey();

  const go = (n: number) => {
    const next = addMonth(month, n);
    if (n > 0 && month >= thisMonthKey()) return; // no future months
    setMonth(next);
    onSeasonChange?.(seasonOfKey(next + "-01"));
  };

  return (
    <div className="cal">
      <div className="cal__bar">
        <button className="cal__nav" onClick={() => go(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="cal__month">{monthLabel(month + "-01")}</span>
        <button
          className="cal__nav"
          onClick={() => go(1)}
          disabled={atCurrent}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="cal__dow">
        {DOW_SHORT.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="cal__grid">
        {cells.map((key, i) => {
          if (!key) return <span key={i} className="cal__cell cal__cell--empty" />;
          const entry = byDate.get(key);
          const future = isFuture(key);
          const today = isToday(key);
          const day = Number(key.slice(8));
          return (
            <button
              key={i}
              className={`cal__cell ${entry ? "cal__cell--grown" : ""} ${
                today ? "cal__cell--today" : ""
              } ${future ? "cal__cell--future" : ""}`}
              disabled={future}
              onClick={() => (entry ? onOpenDay(key) : onPlantDate(key))}
              aria-label={`${monthLabel(month + "-01")} ${day}${entry ? ", planted" : ""}`}
            >
              {entry ? (
                <MiniBloom color={MOODS[entry.mood].bloom} size={26} />
              ) : (
                <span className="cal__num">{day}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
