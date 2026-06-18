import React, { useEffect, useState } from "react";
import { PlantFromEntry } from "./PlantSVG";
import type { Entry } from "../lib/db";
import { MOODS, WEATHER } from "../lib/mood";
import { prettyDate } from "../lib/date";

type Props = {
  entry: Entry;
  onClose: () => void;
  onEdit: () => void;
};

/** A logged day, opened like a pressed flower in a journal. */
export function DayCard({ entry, onClose, onEdit }: Props) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = entry.photos.map((p) => URL.createObjectURL(p));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [entry]);

  const mood = MOODS[entry.mood];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="card petal-edge"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={prettyDate(entry.date)}
      >
        <button className="card__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="card__crown" style={{ ["--mc" as string]: mood.bloom }}>
          <PlantFromEntry entry={entry} grow />
        </div>

        <p className="card__date">{prettyDate(entry.date)}</p>

        <div className="card__chips">
          <span className="chip petal-edge" style={{ ["--mc" as string]: mood.bloom }}>
            {mood.face} {mood.label}
          </span>
          {entry.weather && (
            <span className="chip chip--plain petal-edge">
              {WEATHER[entry.weather].glyph} {WEATHER[entry.weather].label}
            </span>
          )}
        </div>

        {entry.text && <p className="card__text">{entry.text}</p>}

        {entry.goodThing && (
          <p className="card__good">
            <span className="card__good-label">one good thing</span>
            {entry.goodThing}
          </p>
        )}

        {urls.length > 0 && (
          <div className="card__photos">
            {urls.map((u, k) => (
              <div className="card__polaroid" key={k} style={{ ["--tilt" as string]: `${(k % 2 ? 1 : -1) * (1.5 + (k % 3))}deg` }}>
                <img src={u} alt="" />
              </div>
            ))}
          </div>
        )}

        <button className="btn btn--ghost card__edit" onClick={onEdit}>
          tend this day
        </button>
      </div>
    </div>
  );
}
