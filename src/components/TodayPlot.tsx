import React from "react";
import { PlantFromEntry } from "./PlantSVG";
import type { Entry } from "../lib/db";
import { greeting } from "../lib/date";

type Props = {
  entry: Entry | undefined;
  onPlant: () => void;
  onOpen: (date: string) => void;
};

/**
 * The freshly-tilled plot at the top of the garden. Empty, it *is* the daily
 * prompt — a soft invitation to plant today. Once logged, it shows today's
 * own plant, freshly grown.
 */
export function TodayPlot({ entry, onPlant, onOpen }: Props) {
  if (entry) {
    return (
      <button className="plot plot--grown" onClick={() => onOpen(entry.date)}>
        <span className="plot__today-plant">
          <PlantFromEntry entry={entry} grow />
        </span>
        <span className="plot__grown-label">
          <span className="eyebrow">today</span>
          <span className="plot__grown-text">planted ✓ tap to revisit</span>
        </span>
      </button>
    );
  }

  return (
    <button className="plot plot--empty" onClick={onPlant}>
      <span className="plot__soil" aria-hidden="true">
        <span className="plot__seed" />
        <span className="plot__furrow" />
      </span>
      <span className="plot__copy">
        <span className="eyebrow">today, unplanted</span>
        <span className="plot__cta">
          {hint()} <strong>plant today →</strong>
        </span>
      </span>
    </button>
  );
}

function hint(): string {
  const g = greeting();
  if (g === "good morning") return "what's growing this morning?";
  if (g === "good afternoon") return "how's the day unfolding?";
  if (g === "good evening") return "how did today grow?";
  if (g === "good night" || g === "still up") return "before you rest —";
  return "how did today grow?";
}
