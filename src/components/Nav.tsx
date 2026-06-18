import React from "react";

export type Tab = "garden" | "seasons";

type Props = {
  tab: Tab;
  onTab: (t: Tab) => void;
  onPlant: () => void;
  plantPulse: boolean;
};

/** Soft bottom nav: Garden · Plant · Seasons. */
export function Nav({ tab, onTab, onPlant, plantPulse }: Props) {
  return (
    <nav className="nav">
      <button
        className={`nav__tab ${tab === "garden" ? "nav__tab--on" : ""}`}
        onClick={() => onTab("garden")}
      >
        <SproutIcon />
        <span>garden</span>
      </button>

      <button
        className={`nav__plant ${plantPulse ? "nav__plant--pulse" : ""}`}
        onClick={onPlant}
        aria-label="Plant today"
      >
        <FlowerPlus />
      </button>

      <button
        className={`nav__tab ${tab === "seasons" ? "nav__tab--on" : ""}`}
        onClick={() => onTab("seasons")}
      >
        <AlmanacIcon />
        <span>almanac</span>
      </button>
    </nav>
  );
}

/** The add button, shaped like a flower: marigold petals, a green heart, a + at its core. */
function FlowerPlus() {
  return (
    <svg className="flower-btn" viewBox="0 0 100 100" aria-hidden="true">
      <g className="flower-btn__petals">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx="50"
            cy="27"
            rx="13"
            ry="19"
            fill="var(--marigold)"
            transform={`rotate(${a} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="18" fill="var(--stem)" />
      <g stroke="#fff" strokeWidth="5.5" strokeLinecap="round">
        <line x1="50" y1="41" x2="50" y2="59" />
        <line x1="41" y1="50" x2="59" y2="50" />
      </g>
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-7" />
      <path d="M12 14c0-3 2.5-4.5 5-4.5 0 3-2.5 4.5-5 4.5Z" />
      <path d="M12 15c0-2.6-2.2-4-4.5-4 0 2.6 2.2 4 4.5 4Z" />
    </svg>
  );
}

function AlmanacIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9h17M8 3v3M16 3v3" />
      <circle cx="8.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
