import React, { useEffect, useState } from "react";
import { canInstall, onInstallChange, promptInstall } from "../lib/install";
import { isIOS, isStandalone } from "../lib/push";

const DISMISS_KEY = "little-garden-install-dismissed";

/**
 * A soft nudge to add Little Garden to the home screen. Slides in a little
 * after landing, only when the app isn't already installed. On Chrome/Android
 * it offers a one-tap install; on iOS it shows the Share-sheet steps.
 */
export function InstallPrompt() {
  const [installable, setInstallable] = useState(canInstall());
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => onInstallChange(() => setInstallable(canInstall())), []);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200); // let them see the garden first
    return () => clearTimeout(t);
  }, []);

  const ios = isIOS();

  if (gone || ready === false) return null;
  if (isStandalone()) return null; // already installed
  if (!installable && !ios) return null; // nothing we can offer here

  const dismiss = (remember = true) => {
    if (remember) localStorage.setItem(DISMISS_KEY, "1");
    setGone(true);
  };

  const install = async () => {
    const accepted = await promptInstall();
    if (accepted) dismiss(false);
  };

  return (
    <div className="install" role="dialog" aria-label="Add to home screen">
      <span className="install__pot" aria-hidden="true">🪴</span>
      <div className="install__body">
        <p className="install__title">keep your garden in your pocket</p>
        {ios && !installable ? (
          <p className="install__sub">
            tap <Share /> <strong>Share</strong>, then <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <p className="install__sub">plant it on your home screen</p>
        )}
      </div>

      {installable && (
        <button className="install__btn" onClick={install}>
          add
        </button>
      )}
      <button className="install__x" onClick={() => dismiss()} aria-label="Not now">
        ×
      </button>
    </div>
  );
}

/** The iOS Share glyph, inline so the instructions are unmistakable. */
function Share() {
  return (
    <svg
      className="install__share"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  );
}
