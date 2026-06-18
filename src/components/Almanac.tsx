import React, { useMemo } from "react";
import { Calendar } from "./Calendar";
import { PlantFromEntry } from "./PlantSVG";
import type { Entry } from "../lib/db";
import { groupByMonth, longestStreak, shortDate, type Season } from "../lib/date";

type Props = {
  entries: Entry[];
  onOpenDay: (date: string) => void;
  onPlantDate: (date: string) => void;
  onSeasonChange?: (s: Season) => void;
};

/** "Looking back": a month calendar, gentle stats, and the seasonal garden beds. */
export function Almanac({ entries, onOpenDay, onPlantDate, onSeasonChange }: Props) {
  const months = useMemo(() => groupByMonth(entries), [entries]);
  const total = entries.length;
  const longest = useMemo(() => longestStreak(entries.map((e) => e.date)), [entries]);

  return (
    <main className="scroll almanac">
      <header className="almanac__head">
        <p className="eyebrow">looking back</p>
        <h1 className="almanac__title">your almanac</h1>
      </header>

      <Calendar
        entries={entries}
        onOpenDay={onOpenDay}
        onPlantDate={onPlantDate}
        onSeasonChange={onSeasonChange}
      />

      <div className="stats">
        <Stat n={total} label={total === 1 ? "day grown" : "days grown"} />
        <Stat n={longest} label="longest streak" />
        <Stat n={months.length} label={months.length === 1 ? "month" : "months"} />
      </div>

      {months.length === 0 ? (
        <p className="almanac__empty">no seasons yet — plant a few days to fill them in.</p>
      ) : (
        <section className="beds">
          <p className="beds__label-top">the beds</p>
          {months.map((m) => (
            <section className="bed" key={m.key}>
              <h2 className="bed__label">{m.label}</h2>
              <div className="bed__row">
                {m.entries
                  .slice()
                  .sort((a, b) => (a.date < b.date ? -1 : 1))
                  .map((e) => (
                    <button
                      key={e.date}
                      className="bed__plant"
                      onClick={() => onOpenDay(e.date)}
                      aria-label={`Open ${shortDate(e.date)}`}
                    >
                      <PlantFromEntry entry={e} />
                      <span className="bed__day">{Number(e.date.slice(8))}</span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat">
      <span className="stat__n">{n}</span>
      <span className="stat__l">{label}</span>
    </div>
  );
}
