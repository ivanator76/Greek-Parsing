import assert from "node:assert/strict";
import test from "node:test";
import { GREEK_TEXT_SOURCE } from "../src/text-source.js";

test("Greek text source label identifies the Tischendorf source used by the worksheet", () => {
  assert.equal(GREEK_TEXT_SOURCE, "希臘原文：Tischendorf Greek New Testament");
});
