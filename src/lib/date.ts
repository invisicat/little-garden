/* ============================================================
   date.ts — days, streaks, and seasons.
   Dates are stored as local "YYYY-MM-DD" keys (no timezone drift).
   ============================================================ */

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function isToday(key: string): boolean {
  return key === dayKey();
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Wednesday, June 17" — for day cards. */
export function prettyDate(key: string): string {
  const d = parseKey(key);
  const full = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    d.getDay()
  ];
  return `${full}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

/** "Jun 17" — compact label on the path. */
export function shortDate(key: string): string {
  const d = parseKey(key);
  return `${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export function weekday(key: string): string {
  return DOW[parseKey(key).getDay()];
}

export function monthLabel(key: string): string {
  const d = parseKey(key);
  return `${MON[d.getMonth()]} ${d.getFullYear()}`;
}

/** Greeting tuned to the hour. */
export function greeting(hour: number = new Date().getHours()): string {
  if (hour < 5) return "still up";
  if (hour < 12) return "good morning";
  if (hour < 17) return "good afternoon";
  if (hour < 21) return "good evening";
  return "good night";
}

/**
 * Current streak: consecutive logged days ending today (or yesterday — we
 * don't break a streak until a full day is missed).
 */
export function currentStreak(keys: Set<string>): number {
  let cursor = dayKey();
  if (!keys.has(cursor)) {
    // grace: if today isn't logged yet, count up to yesterday
    cursor = addDays(cursor, -1);
    if (!keys.has(cursor)) return 0;
  }
  let n = 0;
  while (keys.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(keys: string[]): number {
  if (keys.length === 0) return 0;
  const set = new Set(keys);
  let best = 0;
  for (const k of set) {
    // only start counting at the beginning of a run
    if (set.has(addDays(k, -1))) continue;
    let n = 0;
    let cur = k;
    while (set.has(cur)) {
      n++;
      cur = addDays(cur, 1);
    }
    best = Math.max(best, n);
  }
  return best;
}

export type Season = "spring" | "summer" | "autumn" | "winter";

/** Northern-hemisphere season for a month (1–12). */
export function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function seasonOfKey(key: string): Season {
  return seasonOf(Number(key.slice(5, 7)) || 6);
}

/* ----- calendar helpers (month is a "YYYY-MM" key) ----- */
export function thisMonthKey(d: Date = new Date()): string {
  return dayKey(d).slice(0, 7);
}

export function addMonth(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** A 6×7 grid of day-keys (or null for padding) for a month's calendar. */
export function monthGrid(monthKey: string): (string | null)[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startDow = first.getDay(); // 0 = Sun
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DOW_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/** Is `key` strictly after today? (no planting the future) */
export function isFuture(key: string): boolean {
  return key > dayKey();
}

/** Group day-keys (newest first) by month for the Seasons view. */
export function groupByMonth<T extends { date: string }>(
  entries: T[],
): { label: string; key: string; entries: T[] }[] {
  const map = new Map<string, T[]>();
  for (const e of entries) {
    const mk = e.date.slice(0, 7); // YYYY-MM
    if (!map.has(mk)) map.set(mk, []);
    map.get(mk)!.push(e);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([mk, es]) => ({
      key: mk,
      label: monthLabel(mk + "-01"),
      entries: es,
    }));
}
