import assert from "node:assert/strict";
import test from "node:test";
import { nextHorizontalTabKey } from "../src/tab-order.js";

test("nextHorizontalTabKey moves parsing inputs right across the same row before moving down", () => {
  const keys = [
    "verse-1:syntax:0",
    "verse-1:syntax:1",
    "verse-1:syntax:2",
    "verse-1:morphology:0",
    "verse-1:morphology:1",
    "verse-1:morphology:2",
    "verse-1:gloss:0",
    "verse-1:gloss:1",
    "verse-1:gloss:2",
    "verse-1:translation:"
  ];

  assert.equal(nextHorizontalTabKey("verse-1:syntax:0", keys), "verse-1:syntax:1");
  assert.equal(nextHorizontalTabKey("verse-1:syntax:2", keys), "verse-1:morphology:0");
  assert.equal(nextHorizontalTabKey("verse-1:gloss:2", keys), "verse-1:translation:");
});

test("nextHorizontalTabKey supports shift-tab in the opposite direction", () => {
  const keys = [
    "verse-1:syntax:0",
    "verse-1:syntax:1",
    "verse-1:morphology:0",
    "verse-1:morphology:1"
  ];

  assert.equal(nextHorizontalTabKey("verse-1:morphology:0", keys, { backwards: true }), "verse-1:syntax:1");
});
