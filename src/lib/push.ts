/* ============================================================
   push.ts — client side of the evening nudge.
   The server only ever learns "ping this device at HH:MM".
   No journal content is sent.
   ============================================================ */

export type PushSupport =
  | { state: "ok" }
  | { state: "unsupported" } // browser can't do push at all
  | { state: "needs-install" }; // iOS Safari: must add to Home Screen first

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function pushSupport(): PushSupport {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    // iOS gains PushManager only inside an installed PWA
    if (isIOS() && !isStandalone()) return { state: "needs-install" };
    return { state: "unsupported" };
  }
  return { state: "ok" };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function getVapidKey(): Promise<string> {
  const res = await fetch("/api/push/key");
  const { key } = await res.json();
  return key;
}

/**
 * Is the push backend reachable? It isn't on a static host (e.g. Vercel),
 * where there's no always-on server to send the nudges. Lets the UI hide
 * reminders gracefully instead of erroring.
 */
export async function pushBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/push/key");
    if (!res.ok) return false;
    const { key } = await res.json();
    return Boolean(key);
  } catch {
    return false;
  }
}

/** Subscribe this device and register the reminder time. */
export async function enablePush(reminderTime: string): Promise<boolean> {
  const support = pushSupport();
  if (support.state !== "ok") return false;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const key = await getVapidKey();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  }

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subscription: sub,
      reminderTime,
      tzOffset: new Date().getTimezoneOffset(), // minutes
    }),
  });
  return true;
}

/** Update just the reminder time for an existing subscription. */
export async function updateReminderTime(reminderTime: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subscription: sub,
      reminderTime,
      tzOffset: new Date().getTimezoneOffset(),
    }),
  });
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}

/** Ask the server to send a test nudge right now. */
export async function sendTestPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
}
