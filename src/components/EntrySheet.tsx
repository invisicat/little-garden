import React, { useEffect, useRef, useState } from "react";
import { putEntry, type Entry } from "../lib/db";
import { MOOD_ORDER, MOODS, WEATHER, WEATHER_ORDER, type MoodKey, type WeatherKey } from "../lib/mood";
import { prettyDate } from "../lib/date";

type Props = {
  date: string;
  existing?: Entry;
  onClose: () => void;
  onSaved: () => void;
};

export function EntrySheet({ date, existing, onClose, onSaved }: Props) {
  const [text, setText] = useState(existing?.text ?? "");
  const [mood, setMood] = useState<MoodKey | null>(existing?.mood ?? null);
  const [goodThing, setGoodThing] = useState(existing?.goodThing ?? "");
  const [weather, setWeather] = useState<WeatherKey | null>(existing?.weather ?? null);
  const [photos, setPhotos] = useState<Blob[]>(existing?.photos ?? []);
  const [urls, setUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // object URLs for previews
  useEffect(() => {
    const next = photos.map((p) => URL.createObjectURL(p));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const canSave = text.trim().length > 0 || mood !== null || photos.length > 0;

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming: Blob[] = [];
    for (const f of Array.from(list).slice(0, 6)) {
      if (!f.type.startsWith("image/")) continue;
      incoming.push(await downscale(f));
    }
    setPhotos((p) => [...p, ...incoming].slice(0, 6));
  }

  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    const now = Date.now();
    const entry: Entry = {
      date,
      text: text.trim(),
      mood: mood ?? "good",
      goodThing: goodThing.trim(),
      weather,
      photos,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await putEntry(entry);
    // let the planting flourish play before closing
    setTimeout(onSaved, 950);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet ${saving ? "sheet--planting" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Plant your day"
      >
        <div className="sheet__grip" />
        <div className="sheet__scroll">
          <header className="sheet__head">
            <span className="eyebrow">{existing ? "tending" : "planting"}</span>
            <h2 className="sheet__date">{prettyDate(date)}</h2>
          </header>

          {/* mood — the weather of the day */}
          <div className="field">
            <label className="field__label">how did it feel?</label>
            <div className="moods" role="radiogroup" aria-label="Mood">
              {MOOD_ORDER.map((m) => {
                const on = mood === m;
                return (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={on}
                    className={`mood ${on ? "mood--on" : ""}`}
                    style={on ? { ["--mc" as string]: MOODS[m].bloom } : undefined}
                    onClick={() => setMood(m)}
                  >
                    <span className="mood__face">{MOODS[m].face}</span>
                    <span className="mood__label">{MOODS[m].label}</span>
                  </button>
                );
              })}
            </div>
            {mood && <p className="mood__note">{MOODS[mood].note}</p>}
          </div>

          {/* free write */}
          <div className="field">
            <label className="field__label" htmlFor="entry-text">
              what did today hold?
            </label>
            <textarea
              id="entry-text"
              className="field__text"
              placeholder="today I…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
          </div>

          {/* one good thing */}
          <div className="field">
            <label className="field__label" htmlFor="good-thing">
              one good thing
            </label>
            <input
              id="good-thing"
              className="field__input"
              placeholder="a small bright moment"
              value={goodThing}
              onChange={(e) => setGoodThing(e.target.value)}
            />
          </div>

          {/* photos */}
          <div className="field">
            <label className="field__label">a few pictures</label>
            <div className="photos">
              {urls.map((u, k) => (
                <div className="photo" key={k}>
                  <img src={u} alt="" />
                  <button
                    className="photo__x"
                    aria-label="Remove photo"
                    onClick={() => setPhotos((p) => p.filter((_, i) => i !== k))}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <button className="photo photo--add" onClick={() => fileRef.current?.click()}>
                  <span>＋</span>
                  <small>add</small>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* weather — light flavor */}
          <div className="field">
            <label className="field__label">the sky outside</label>
            <div className="weather">
              {WEATHER_ORDER.map((w) => (
                <button
                  key={w}
                  className={`wbtn ${weather === w ? "wbtn--on" : ""}`}
                  aria-pressed={weather === w}
                  aria-label={WEATHER[w].label}
                  onClick={() => setWeather(weather === w ? null : w)}
                >
                  {WEATHER[w].glyph}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sheet__foot">
          <button className="btn btn--ghost" onClick={onClose}>
            not now
          </button>
          <button className="btn btn--plant" disabled={!canSave || saving} onClick={save}>
            {saving ? "planting…" : existing ? "save changes 🌱" : "plant it 🌱"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Downscale a photo to keep on-device storage light. */
async function downscale(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", quality),
    );
  } catch {
    return file;
  }
}
