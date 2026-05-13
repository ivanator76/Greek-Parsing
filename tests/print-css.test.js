import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("print word columns wrap without stretching a single final word across the page", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.word-column\s*\{[^}]*flex:\s*0 1 calc\(\(100% - 42px\) \/ 7\);/s);
});
