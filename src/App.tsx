import React, { useEffect, useState, useCallback } from "react";
import { Sky } from "./components/Sky";
import { Ambient } from "./components/Ambient";
import { Garden } from "./components/Garden";
import { Almanac } from "./components/Almanac";
import { EntrySheet } from "./components/EntrySheet";
import { DayCard } from "./components/DayCard";
import { Settings } from "./components/Settings";
import { InstallPrompt } from "./components/InstallPrompt";
import { Nav, type Tab } from "./components/Nav";
import { getAllEntries, loadPrefs, savePrefs, type Entry, type Prefs } from "./lib/db";
import { dayKey, isFuture, seasonOfKey, type Season } from "./lib/date";

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("garden");
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [season, setSeason] = useState<Season>(() => seasonOfKey(dayKey()));

  // theme: explicit day/night, or "auto" following the device's color scheme
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  const night = prefs.theme === "night" || (prefs.theme === "auto" && systemDark);
  useEffect(() => {
    document.documentElement.dataset.theme = night ? "night" : "day";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", night ? "#161f1a" : "#EFF3E9");
  }, [night]);

  // overlays
  const [editDate, setEditDate] = useState<string | null>(null); // entry sheet
  const [viewDate, setViewDate] = useState<string | null>(null); // day card
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(async () => {
    setEntries(await getAllEntries());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, [refresh]);

  const updatePrefs = useCallback((p: Prefs) => {
    setPrefs(p);
    savePrefs(p);
  }, []);

  const byDate = new Map(entries.map((e) => [e.date, e]));
  const today = dayKey();
  const loggedToday = byDate.has(today);

  const openToday = () => setEditDate(today);
  const plantDate = (d: string) => {
    if (!isFuture(d)) setEditDate(d); // backfill any past day
  };

  return (
    <div className="app">
      <Sky night={night} />
      <Ambient season={season} />

      {tab === "garden" ? (
        <Garden
          entries={entries}
          prefs={prefs}
          loaded={loaded}
          onPlantToday={openToday}
          onOpenDay={(d) => setViewDate(d)}
          onOpenSettings={() => setShowSettings(true)}
          onSeasonChange={setSeason}
        />
      ) : (
        <Almanac
          entries={entries}
          onOpenDay={(d) => setViewDate(d)}
          onPlantDate={plantDate}
          onSeasonChange={setSeason}
        />
      )}

      <InstallPrompt />

      <Nav
        tab={tab}
        onTab={setTab}
        onPlant={openToday}
        plantPulse={!loggedToday}
      />

      {editDate && (
        <EntrySheet
          date={editDate}
          existing={byDate.get(editDate)}
          onClose={() => setEditDate(null)}
          onSaved={async () => {
            setEditDate(null);
            await refresh();
          }}
        />
      )}

      {viewDate && byDate.get(viewDate) && (
        <DayCard
          entry={byDate.get(viewDate)!}
          onClose={() => setViewDate(null)}
          onEdit={() => {
            const d = viewDate;
            setViewDate(null);
            setEditDate(d);
          }}
        />
      )}

      {showSettings && (
        <Settings
          prefs={prefs}
          entries={entries}
          onChange={updatePrefs}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
