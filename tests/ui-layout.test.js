import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

function functionBody(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = appSource.indexOf("\nfunction ", start + 1);
  return appSource.slice(start, next === -1 ? appSource.length : next);
}

test("top toolbar omits the blank page button and density controls", () => {
  const toolbar = functionBody("renderToolbar");

  assert.doesNotMatch(toolbar, /data-action="new-practice-page"/);
  assert.doesNotMatch(toolbar, /data-action="set-density"/);
});

test("page side panel places the density range directly below the page heading", () => {
  const sidePanel = functionBody("renderSidePanel");

  assert.match(sidePanel, /<h2>本頁<\/h2>\s*\$\{renderDensityControl\(\)\}/);
  assert.match(appSource, /<input[^>]+type="range"[^>]+data-density-range/s);
  assert.match(appSource, /寬鬆[\s\S]*標準[\s\S]*緊密/);
});
