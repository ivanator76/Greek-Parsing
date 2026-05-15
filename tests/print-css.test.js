import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("print word columns wrap without stretching a single final word across the page", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.word-column\s*\{[^}]*flex:\s*0 1 calc\(\(100% - 42px\) \/ 7\);/s);
});

test("print Greek words stay on one line inside their word column", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /@media print\s*\{[\s\S]*\.greek-word\s*\{[^}]*white-space:\s*nowrap;[\s\S]*?\}/);
  assert.doesNotMatch(css, /@media print\s*\{[\s\S]*\.greek-word\s*\{[^}]*overflow-wrap:\s*anywhere;/);
});

test("line break controls are only visible while reflow mode is active", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.line-break-toggle\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.is-reflow-mode\s+\.line-break-toggle\s*\{[^}]*display:\s*inline-flex;/s);
  assert.match(css, /@media print\s*\{[\s\S]*\.line-break-toggle\s*\{[^}]*display:\s*none\s*!important;/);
});
