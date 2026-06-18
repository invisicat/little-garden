import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PlantSVG } from "./components/PlantSVG";
import { MOOD_ORDER, MOODS, type MoodKey } from "./lib/mood";
import type { Season } from "./lib/date";
import "./styles.css";

const SEASONS: { key: Season; label: string; month: string }[] = [
  { key: "spring", label: "spring", month: "04" },
  { key: "summer", label: "summer", month: "07" },
  { key: "autumn", label: "autumn", month: "10" },
  { key: "winter", label: "winter", month: "01" },
];

/** Build a date in the given month; day cycles the shape variation. */
function dateFor(month: string, day: number): string {
  const d = ((((day - 1) % 27) + 27) % 27) + 1;
  return `2026-${month}-${String(d).padStart(2, "0")}`;
}

function Lab() {
  const [mood, setMood] = useState<MoodKey>("radiant");
  const [seasonKey, setSeasonKey] = useState<Season>("summer");
  const [intensity, setIntensity] = useState(0.7);
  const [photos, setPhotos] = useState(1);
  const [shuffle, setShuffle] = useState(7);
  const stageRef = useRef<HTMLDivElement>(null);

  const season = SEASONS.find((s) => s.key === seasonKey)!;
  const date = dateFor(season.month, shuffle);

  function download() {
    const svg = stageRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    // inline the two CSS-variable colors so the file renders on its own
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = "svg{--stem:#5c8a4e;--stem-bright:#6fa85c;--dew-deep:#e4ecdc}";
    clone.insertBefore(style, clone.firstChild);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plant-${mood}-${date}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="lab">
      <header className="lab__head">
        <p className="eyebrow">the seed catalog</p>
        <h1 className="lab__title">flower lab</h1>
        <p className="lab__sub">
          every day grows one unique plant. poke the dials and watch the generator change.
        </p>
      </header>

      <section className="lab__stage-wrap">
        <div className="lab__stage" ref={stageRef}>
          <PlantSVG date={date} mood={mood} intensity={intensity} accents={photos} grow />
        </div>
        <p className="lab__seed">seed · {date}</p>
        <button className="btn btn--ghost lab__dl" onClick={download}>
          download svg ↓
        </button>
      </section>

      <section className="lab__controls">
        <div className="field">
          <label className="field__label">mood → bloom &amp; color</label>
          <div className="moods">
            {MOOD_ORDER.map((m) => (
              <button
                key={m}
                className={`mood ${mood === m ? "mood--on" : ""}`}
                style={mood === m ? ({ "--mc": MOODS[m].bloom } as React.CSSProperties) : undefined}
                onClick={() => setMood(m)}
              >
                <span className="mood__face">{MOODS[m].face}</span>
                <span className="mood__label">{MOODS[m].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label">season → leaf color</label>
          <div className="seg">
            {SEASONS.map((s) => (
              <button
                key={s.key}
                className={`seg__btn ${seasonKey === s.key ? "seg__btn--on" : ""}`}
                onClick={() => setSeasonKey(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label">fullness — {Math.round(intensity * 100)}%</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={intensity}
            onChange={(e) => setIntensity(+e.target.value)}
            className="lab__range"
          />
          <p className="hint">more writing → taller &amp; leafier, then a bunch + berries + a vine.</p>
        </div>

        <div className="field">
          <label className="field__label">photos — {photos}</label>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={photos}
            onChange={(e) => setPhotos(+e.target.value)}
            className="lab__range"
          />
          <p className="hint">each photo sprouts a little bud.</p>
        </div>

        <button className="btn btn--plant lab__shuffle" onClick={() => setShuffle((s) => s + 1)}>
          🎲 reshuffle the shape
        </button>
      </section>

      <section className="lab__gallery">
        <h2 className="lab__h2">moods × seasons</h2>
        <div className="lab__grid">
          {MOOD_ORDER.map((m) =>
            SEASONS.map((s) => (
              <figure className="lab__cell" key={m + s.key}>
                <PlantSVG date={dateFor(s.month, 15)} mood={m} intensity={0.82} accents={1} />
                <figcaption>
                  {MOODS[m].label} · {s.label}
                </figcaption>
              </figure>
            )),
          )}
        </div>
      </section>

      <section className="lab__gallery">
        <h2 className="lab__h2">a day filling up</h2>
        <div className="lab__grid lab__grid--row">
          {[0.1, 0.35, 0.6, 0.82, 1].map((iv) => (
            <figure className="lab__cell" key={iv}>
              <PlantSVG
                date={dateFor(season.month, 15)}
                mood={mood}
                intensity={iv}
                accents={iv > 0.6 ? 2 : 0}
              />
              <figcaption>{Math.round(iv * 100)}%</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="lab__foot">
        <a href="./">← back to the garden</a>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Lab />);
