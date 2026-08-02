import assert from "node:assert/strict";
import { access } from "node:fs/promises";

import {
  demoLabHtml,
  repairedLandingHtml,
  repairedRevenueAppHtml,
} from "../dist/server/revenue-os.js";

const pages = [
  ["landing", repairedLandingHtml],
  ["demo", demoLabHtml],
  ["revenue app", repairedRevenueAppHtml],
];

for (const [name, html] of pages) {
  assert.match(html, /\/brand\/suadence-logo\.webp/, `${name} must use the optimized logo`);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script), `${name} contains invalid client JavaScript`);
  }
}

assert.match(repairedLandingHtml, />TBD</, "landing page must display TBD pricing");
assert.doesNotMatch(repairedLandingHtml, /\$[\d,]+/, "landing page must not publish a price");
assert.match(demoLabHtml, /SYNTHETIC DATA ONLY/, "demo must visibly label synthetic data");
assert.match(
  demoLabHtml,
  /\.demo-top\.demo-top\{align-items:center;gap:8px;padding:10px 12px\}/,
  "demo must include the mobile header overflow guard",
);
assert.match(repairedRevenueAppHtml, /Storage unavailable/, "app must include a safe storage fallback");

await access(new URL("../public/brand/suadence-logo.webp", import.meta.url));

console.log("Hosted HTML validation passed for landing, demo, and Revenue OS pages.");
