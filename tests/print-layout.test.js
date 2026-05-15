import assert from "node:assert/strict";
import test from "node:test";
import { maxEditColumns, maxPrintColumns, normalizeLayoutDensity, printPageRule } from "../src/print-layout.js";

test("printPageRule follows the selected page orientation", () => {
  assert.equal(printPageRule("portrait"), "@page { size: A4 portrait; margin: 10mm; }");
  assert.equal(printPageRule("landscape"), "@page { size: A4 landscape; margin: 10mm; }");
});

test("maxPrintColumns uses fewer columns for portrait print width at standard density", () => {
  assert.equal(maxPrintColumns("portrait"), 4);
  assert.equal(maxPrintColumns("landscape"), 7);
});

test("maxPrintColumns increases columns in compact density", () => {
  assert.equal(maxPrintColumns("portrait", "compact"), 5);
  assert.equal(maxPrintColumns("landscape", "compact"), 9);
});

test("maxEditColumns follows layout density", () => {
  assert.equal(maxEditColumns("loose"), 5);
  assert.equal(maxEditColumns("standard"), 6);
  assert.equal(maxEditColumns("compact"), 8);
});

test("normalizeLayoutDensity falls back to standard for unknown values", () => {
  assert.equal(normalizeLayoutDensity("compact"), "compact");
  assert.equal(normalizeLayoutDensity("mystery"), "standard");
});
