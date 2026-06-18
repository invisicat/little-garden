# 🌱 Little Garden

A gentle, whimsical day-tracking PWA. You write a few words about your day, add a
photo or two, tap a mood — and the day grows a unique little plant. Scroll back and
you walk down a winding garden path through everything you've grown.

- **Mobile-first** — built as a phone-width PWA you can install to your home screen.
- **Local-first** — every entry (and photo) lives only on your device, in IndexedDB.
  Nothing you write ever touches a server.
- **Evening nudges** — optional web-push reminders to plant your day. The server only
  ever learns *"ping this device at 8pm"*, never your journal.

## Run it

```sh
bun install
bun run dev      # http://localhost:3000 (hot reload)
```

`bun run start` runs it without hot reload.

### Push reminders (optional)

VAPID keys are generated into `.env` already. To regenerate:

```sh
bun -e "console.log(require('web-push').generateVAPIDKeys())"
```

…and put the values in `.env` as `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
(plus `VAPID_SUBJECT=mailto:you@example.com`).

> **iPhone note:** Web Push only works once the PWA is **installed to the Home Screen**
> (Share → Add to Home Screen) on iOS 16.4+. The app detects this and shows a hint.
> The in-app greeting works everywhere regardless.

## How it's built

- **Bun + `Bun.serve()`** serves the app (React via HTML imports) *and* the push API.
- **Plain CSS** with custom properties — the "morning garden light" design system.
- **`src/lib/plant.ts`** is the signature: a deterministic SVG generator that grows a
  unique plant from each day (mood → bloom color, writing length → height, date → shape).
- **`bun:sqlite`** stores push subscriptions; a minute-tick scheduler sends the nudge.

```
server.ts          app shell + /api/push/* + reminder scheduler
src/
  App.tsx          views: Garden · Seasons · Entry · Day · Settings
  lib/             plant (signature) · db (IndexedDB) · date · mood · push
  components/      Garden · PlantSVG · EntrySheet · DayCard · SeasonsView · …
public/            manifest · service-worker · icons
```
