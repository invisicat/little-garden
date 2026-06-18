import React, { useEffect, useState } from "react";
import type { Entry, Prefs } from "../lib/db";
import {
  disablePush,
  enablePush,
  isStandalone,
  pushBackendAvailable,
  pushSupport,
  sendTestPush,
  updateReminderTime,
} from "../lib/push";

type Props = {
  prefs: Prefs;
  entries: Entry[];
  onChange: (p: Prefs) => void;
  onClose: () => void;
};

export function Settings({ prefs, entries, onChange, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const support = pushSupport();

  // on a static host (e.g. Vercel) there's no server to send nudges
  const [hasBackend, setHasBackend] = useState<boolean | null>(null);
  useEffect(() => {
    pushBackendAvailable().then(setHasBackend);
  }, []);

  async function toggleReminders(on: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      if (on) {
        const ok = await enablePush(prefs.reminderTime);
        if (ok) {
          onChange({ ...prefs, remindersOn: true });
          setMsg("nudges on — I'll tap you each evening 🌙");
        } else {
          setMsg("couldn't turn on notifications — permission was declined.");
        }
      } else {
        await disablePush();
        onChange({ ...prefs, remindersOn: false });
        setMsg("nudges off.");
      }
    } catch {
      setMsg("something went wrong setting that up.");
    } finally {
      setBusy(false);
    }
  }

  async function changeTime(time: string) {
    onChange({ ...prefs, reminderTime: time });
    if (prefs.remindersOn) {
      try {
        await updateReminderTime(time);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet sheet--settings petal-edge" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="sheet__grip" />
        <div className="sheet__scroll">
          <header className="sheet__head">
            <span className="eyebrow">your garden</span>
            <h2 className="sheet__date">settings</h2>
          </header>

          <div className="field">
            <label className="field__label" htmlFor="name">
              what should I call you?
            </label>
            <input
              id="name"
              className="field__input"
              placeholder="your name"
              value={prefs.name}
              onChange={(e) => onChange({ ...prefs, name: e.target.value })}
            />
          </div>

          <div className="field">
            <span className="field__label">appearance</span>
            <div className="seg" role="radiogroup" aria-label="Appearance">
              {(
                [
                  { key: "day", label: "☀ day" },
                  { key: "night", label: "🌙 night" },
                  { key: "auto", label: "auto" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  role="radio"
                  aria-checked={prefs.theme === t.key}
                  className={`seg__btn ${prefs.theme === t.key ? "seg__btn--on" : ""}`}
                  onClick={() => onChange({ ...prefs, theme: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings__divider" />

          <div className="field">
            <div className="toggle-row">
              <div>
                <span className="field__label">evening nudge</span>
                <p className="hint">a gentle notification to plant your day.</p>
              </div>
              <button
                className={`switch ${prefs.remindersOn ? "switch--on" : ""}`}
                role="switch"
                aria-checked={prefs.remindersOn}
                disabled={busy || support.state !== "ok" || hasBackend === false}
                onClick={() => toggleReminders(!prefs.remindersOn)}
              >
                <span className="switch__knob" />
              </button>
            </div>

            {hasBackend === false && (
              <p className="install-hint">
                this is the hosted version — evening nudges need the self-hosted server. The garden
                still greets you warmly each time you open it.
              </p>
            )}
            {hasBackend !== false && support.state === "needs-install" && (
              <p className="install-hint">
                📲 to get nudges on iPhone, tap <strong>Share → Add to Home Screen</strong>, then
                open Little Garden from there.
              </p>
            )}
            {hasBackend !== false && support.state === "unsupported" && (
              <p className="install-hint">
                this browser can't send notifications, but the garden still greets you when you
                open it.
              </p>
            )}

            {hasBackend !== false && (
              <div className="time-row">
                <label htmlFor="rtime">remind me at</label>
                <input
                  id="rtime"
                  type="time"
                  className="field__input field__input--time"
                  value={prefs.reminderTime}
                  onChange={(e) => changeTime(e.target.value)}
                />
              </div>
            )}

            {prefs.remindersOn && isStandalone() && (
              <button
                className="btn btn--ghost test-btn"
                onClick={async () => {
                  await sendTestPush();
                  setMsg("sent a test nudge — peek at your notifications.");
                }}
              >
                send a test nudge
              </button>
            )}

            {msg && <p className="settings__msg">{msg}</p>}
          </div>

          <div className="settings__divider" />

          <p className="settings__foot">
            🌱 {entries.length} {entries.length === 1 ? "day" : "days"} live safely on this device.
            Nothing you write ever leaves it.
          </p>

          <a className="settings__lab" href="./flowers.html">
            🌼 visit the flower lab
          </a>
        </div>

        <div className="sheet__foot sheet__foot--single">
          <button className="btn btn--plant" onClick={onClose}>
            done
          </button>
        </div>
      </div>
    </div>
  );
}
