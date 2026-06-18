/* ============================================================
   server.ts — serves the PWA + the evening-nudge push service.

   What the server knows: a push subscription, a reminder time, and a
   timezone offset. It never sees a single journal entry — those live
   only on the device's IndexedDB.
   ============================================================ */

import { Database } from "bun:sqlite";
import webpush from "web-push";
import index from "./index.html";

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC = `${import.meta.dir}/public`;

// --- VAPID ---
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:hello@example.com";
const pushReady = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
if (pushReady) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  console.warn("⚠️  No VAPID keys in .env — push reminders are disabled.");
}

// --- subscription store ---
const db = new Database("garden.sqlite");
db.run(`CREATE TABLE IF NOT EXISTS subs (
  endpoint     TEXT PRIMARY KEY,
  subscription TEXT NOT NULL,
  reminderTime TEXT NOT NULL,
  tzOffset     INTEGER NOT NULL,
  lastSent     TEXT
)`);

type Sub = {
  endpoint: string;
  subscription: string;
  reminderTime: string;
  tzOffset: number;
  lastSent: string | null;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

// In production (e.g. behind a Cloudflare tunnel) serve an optimized static
// bundle with no HMR runtime — the dev bundle's websocket/runtime breaks
// through a public proxy. Set NODE_ENV=production to enable.
const isDev = process.env.NODE_ENV !== "production";

const server = Bun.serve({
  port: PORT,
  development: isDev && { hmr: true, console: true },

  routes: {
    "/": index,

    "/api/push/key": () => json({ key: VAPID_PUBLIC }),

    "/api/push/subscribe": {
      POST: async (req) => {
        const body = (await req.json()) as {
          subscription: { endpoint: string };
          reminderTime: string;
          tzOffset: number;
        };
        const { subscription, reminderTime, tzOffset } = body;
        if (!subscription?.endpoint) return json({ error: "bad subscription" }, 400);
        db.run(
          `INSERT INTO subs (endpoint, subscription, reminderTime, tzOffset, lastSent)
           VALUES (?1, ?2, ?3, ?4, NULL)
           ON CONFLICT(endpoint) DO UPDATE SET
             subscription = ?2, reminderTime = ?3, tzOffset = ?4`,
          [subscription.endpoint, JSON.stringify(subscription), reminderTime, tzOffset],
        );
        return json({ ok: true });
      },
    },

    "/api/push/unsubscribe": {
      POST: async (req) => {
        const { endpoint } = (await req.json()) as { endpoint: string };
        db.run("DELETE FROM subs WHERE endpoint = ?1", [endpoint]);
        return json({ ok: true });
      },
    },

    "/api/push/test": {
      POST: async (req) => {
        const { endpoint } = (await req.json()) as { endpoint: string };
        const row = db
          .query("SELECT * FROM subs WHERE endpoint = ?1")
          .get(endpoint) as Sub | null;
        if (!row) return json({ error: "not found" }, 404);
        await sendNudge(row, "🌱 a little test from your garden");
        return json({ ok: true });
      },
    },
  },

  // static files from /public (manifest, service worker, icons)
  async fetch(req) {
    const url = new URL(req.url);
    const file = Bun.file(PUBLIC + url.pathname);
    if (await file.exists()) return new Response(file);
    return new Response("not found", { status: 404 });
  },
});

console.log(`🌻 Little Garden growing at http://localhost:${server.port}`);

/* ============================================================
   Scheduler — once a minute, nudge anyone whose local clock just
   struck their reminder time (and who hasn't been nudged today).
   ============================================================ */
const NUDGES = [
  "🌱 how did today grow?",
  "🌿 a moment to plant your day?",
  "🌼 your garden's waiting — what happened today?",
  "🌙 before you rest, plant today.",
];

function localParts(tzOffset: number, now: Date) {
  // local = UTC - offset(minutes)
  const local = new Date(now.getTime() - tzOffset * 60_000);
  const hhmm = `${String(local.getUTCHours()).padStart(2, "0")}:${String(
    local.getUTCMinutes(),
  ).padStart(2, "0")}`;
  const day = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(local.getUTCDate()).padStart(2, "0")}`;
  return { hhmm, day };
}

async function sendNudge(row: Sub, bodyText?: string) {
  if (!pushReady) return;
  const sub = JSON.parse(row.subscription);
  const body = bodyText ?? NUDGES[Math.floor(Date.now() / 60000) % NUDGES.length];
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ title: "Little Garden", body }),
    );
  } catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode;
    if (code === 404 || code === 410) {
      db.run("DELETE FROM subs WHERE endpoint = ?1", [row.endpoint]); // expired
    } else {
      console.error("push failed", code ?? err);
    }
  }
}

function tick() {
  if (!pushReady) return;
  const now = new Date();
  const rows = db.query("SELECT * FROM subs").all() as Sub[];
  for (const row of rows) {
    const { hhmm, day } = localParts(row.tzOffset, now);
    if (hhmm === row.reminderTime && row.lastSent !== day) {
      db.run("UPDATE subs SET lastSent = ?1 WHERE endpoint = ?2", [day, row.endpoint]);
      void sendNudge(row);
    }
  }
}

setInterval(tick, 60_000);
tick();
