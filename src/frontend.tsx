import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Base path of wherever the app is served from — "/" when self-hosted, or a
// project subpath like "/little-garden/" on GitHub Pages. Everything is wired
// relative to this so the app works at root OR under a subpath.
const BASE = new URL(".", document.baseURI).pathname;

// PWA link tags injected at runtime (kept out of the bundled HTML so Bun's
// bundler doesn't try to resolve them as build assets).
function addLink(rel: string, href: string) {
  if (document.querySelector(`link[rel="${rel}"]`)) return;
  const l = document.createElement("link");
  l.rel = rel;
  l.href = href;
  document.head.appendChild(l);
}
addLink("manifest", BASE + "manifest.webmanifest");
addLink("apple-touch-icon", BASE + "icons/icon-192.png");

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// register the service worker for offline + push (production-ish only)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(BASE + "service-worker.js", { scope: BASE }).catch(() => {
      /* offline/push simply unavailable — the app still works */
    });
  });
}
