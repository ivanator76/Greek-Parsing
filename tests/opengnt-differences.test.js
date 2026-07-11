import assert from "node:assert/strict";
import test from "node:test";
import { OPENGNT_NA28_DIFFERENCES } from "../src/opengnt-na28-differences.js";

test("bundled OpenGNT comparison data matches the official summary", () => {
  const mainWords = OPENGNT_NA28_DIFFERENCES.main
    .reduce((sum, item) => sum + item.differences.length, 0);
  const minorWords = OPENGNT_NA28_DIFFERENCES.minor
    .reduce((sum, item) => sum + item.differences.length, 0);

  assert.equal(mainWords, 61);
  assert.equal(OPENGNT_NA28_DIFFERENCES.main.length, 60);
  assert.equal(minorWords, 267);
  assert.equal(OPENGNT_NA28_DIFFERENCES.minor.length, 246);
  assert.deepEqual(OPENGNT_NA28_DIFFERENCES.wordOrder, ["Mark 3:3", "Luke 18:4", "Acts 16:28"]);
  assert.match(OPENGNT_NA28_DIFFERENCES.source, /OpenGNT/);
});
