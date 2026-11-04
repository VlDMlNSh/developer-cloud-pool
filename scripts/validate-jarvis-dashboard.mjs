import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../web/jarvis-dashboard/", import.meta.url);
const [html, css, js] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
]);

const requiredSections = ["overview", "tasks", "agents", "pool", "activity"];
assert.match(html, /<!doctype html>/i, "HTML5 doctype is required");
assert.match(html, /<html lang="ru">/i, "Russian document language is required");
assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/i, "Responsive viewport is required");
assert.match(html, /Демонстрационный режим/, "Demo warning must be visible");
assert.match(html, /API не подключён/, "No-live-API state must be explicit");
assert.match(html, /<main\b[^>]*id="main"/i, "Main landmark and skip-link target are required");
assert.match(html, /<a class="skip-link" href="#main">/i, "Keyboard skip link is required");
assert.match(html, /<nav class="mobile-nav"/i, "Mobile navigation is required");

for (const id of requiredSections) {
  assert.match(html, new RegExp('id="' + id + '"'), "Missing section: " + id);
  assert.match(html, new RegExp('href="#' + id + '"'), "Missing navigation target: " + id);
}

assert.match(html, /href="\.\/styles\.css"/, "Local stylesheet reference is required");
assert.match(html, /src="\.\/app\.js"/, "Local script reference is required");
assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:https?:)?\/\//i, "External scripts/styles are forbidden");
assert.doesNotMatch(html, /\son(?:load|error|click|mouseover)\s*=/i, "Inline event handlers are forbidden");

assert.match(css, /@media\s*\(max-width:\s*700px\)/, "Mobile breakpoint is required");
assert.match(css, /env\(safe-area-inset-bottom\)/, "Mobile safe-area inset is required");
assert.match(css, /prefers-reduced-motion:\s*reduce/, "Reduced-motion support is required");

assert.match(js, /IntersectionObserver/, "Mobile navigation observer is required");
assert.doesNotMatch(js, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/, "Network APIs are forbidden in static prototype");
assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage|document\.cookie)\b/, "Persistent browser storage is forbidden");
assert.doesNotMatch(js, /github\.com\/|api\.github\.com\//i, "GitHub API access is forbidden");

console.log("JARVIS_STATIC_UI_VALIDATION=PASS");
console.log("Validated: HTML structure, demo boundary, navigation anchors, local assets, mobile CSS and offline-only JavaScript.");
