import assert from "node:assert/strict";
import test from "node:test";
import { GREEK_TEXT_SOURCE } from "../src/text-source.js";

test("Greek text source label identifies OpenGNT as the worksheet text", () => {
  assert.match(GREEK_TEXT_SOURCE, /希臘原文：Open Greek New Testament \(OpenGNT\)/);
  assert.match(GREEK_TEXT_SOURCE, /Eliran Wong/);
  assert.match(GREEK_TEXT_SOURCE, /CC BY-SA 4\.0/);
});
