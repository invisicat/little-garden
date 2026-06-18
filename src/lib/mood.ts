/* ============================================================
   mood.ts — the five weathers of a day.
   Each mood maps to a bloom color and a little face.
   ============================================================ */

export type MoodKey = "radiant" | "good" | "tender" | "tired" | "stormy";

export type Mood = {
  key: MoodKey;
  label: string;
  bloom: string; // petal color used by the plant
  face: string; // tiny emoji-free glyph for the picker
  note: string; // gentle one-liner
};

export const MOODS: Record<MoodKey, Mood> = {
  radiant: {
    key: "radiant",
    label: "radiant",
    bloom: "#F4A93C", // marigold
    face: "🌞",
    note: "a sunlit kind of day",
  },
  good: {
    key: "good",
    label: "good",
    bloom: "#6FA85C", // green-gold
    face: "🌥",
    note: "steady and warm",
  },
  tender: {
    key: "tender",
    label: "tender",
    bloom: "#E891B0", // petal pink
    face: "🌸",
    note: "soft around the edges",
  },
  tired: {
    key: "tired",
    label: "tired",
    bloom: "#8C9AE0", // periwinkle
    face: "🌙",
    note: "running low, that's okay",
  },
  stormy: {
    key: "stormy",
    label: "stormy",
    bloom: "#E8705B", // poppy
    face: "⛈️",
    note: "weathered something",
  },
};

export const MOOD_ORDER: MoodKey[] = ["radiant", "good", "tender", "tired", "stormy"];

/* ============================================================
   weather — a quick optional tap, purely cosmetic flavor.
   ============================================================ */
export type WeatherKey = "sun" | "cloud" | "rain" | "snow" | "wind" | "star";

export const WEATHER: Record<WeatherKey, { glyph: string; label: string }> = {
  sun: { glyph: "☀️", label: "sunny" },
  cloud: { glyph: "☁️", label: "cloudy" },
  rain: { glyph: "🌧️", label: "rainy" },
  snow: { glyph: "❄️", label: "snowy" },
  wind: { glyph: "🍃", label: "windy" },
  star: { glyph: "🌟", label: "clear night" },
};

export const WEATHER_ORDER: WeatherKey[] = ["sun", "cloud", "rain", "snow", "wind", "star"];
