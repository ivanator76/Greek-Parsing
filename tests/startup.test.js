import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("module and standalone startup share a single initialization guard", () => {
  assert.match(appSource, /if \(globalThis\.__greekParsingAppStarted\) return;/);
  assert.match(appSource, /globalThis\.__greekParsingAppStarted = true;/);
  assert.match(indexSource, /window\.__greekParsingAppStarted/);
});

test("asset cache keys are generated automatically for every page load", () => {
  assert.match(indexSource, /__greekParsingAssetVersion = Date\.now\(\)\.toString\(36\)/);
  assert.match(indexSource, /styles\.css\?v=" \+ window\.__greekParsingAssetVersion/);
  assert.match(indexSource, /app\.js\?v=" \+ window\.__greekParsingAssetVersion/);
  assert.match(indexSource, /app-standalone\.js\?v=" \+ window\.__greekParsingAssetVersion/);
  assert.doesNotMatch(indexSource, /20260527-projection-mode/);
});
