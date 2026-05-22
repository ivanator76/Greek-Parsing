import assert from "node:assert/strict";
import test from "node:test";
import { GREEK_TEXT_SOURCE } from "../src/text-source.js";

test("Greek text source label identifies SBLGNT as the default worksheet text", () => {
  assert.match(GREEK_TEXT_SOURCE, /希臘原文：SBL Greek New Testament/);
  assert.match(GREEK_TEXT_SOURCE, /CC BY 4\.0/);
});
