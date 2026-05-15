import assert from "node:assert/strict";
import test from "node:test";
import { nextArrowKey, nextHorizontalTabKey } from "../src/tab-order.js";

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

test("nextArrowKey moves left and right within the same parsing row", () => {
  assert.equal(nextArrowKey("verse-1:syntax:1", "ArrowRight", { wordCount: 3 }), "verse-1:syntax:2");
  assert.equal(nextArrowKey("verse-1:syntax:1", "ArrowLeft", { wordCount: 3 }), "verse-1:syntax:0");
  assert.equal(nextArrowKey("verse-1:syntax:0", "ArrowLeft", { wordCount: 3 }), null);
});

test("nextArrowKey moves up and down between fillable parsing rows for the same word", () => {
  assert.equal(nextArrowKey("verse-1:syntax:1", "ArrowDown", { wordCount: 3 }), "verse-1:morphology:1");
  assert.equal(nextArrowKey("verse-1:morphology:1", "ArrowDown", { wordCount: 3 }), "verse-1:gloss:1");
  assert.equal(nextArrowKey("verse-1:gloss:1", "ArrowUp", { wordCount: 3 }), "verse-1:morphology:1");
  assert.equal(nextArrowKey("verse-1:morphology:1", "ArrowUp", { wordCount: 3 }), "verse-1:syntax:1");
});

test("nextArrowKey moves between the gloss row and the translation row", () => {
  assert.equal(nextArrowKey("verse-1:gloss:2", "ArrowDown", { wordCount: 3 }), "verse-1:translation:");
  assert.equal(nextArrowKey("verse-1:translation:", "ArrowUp", { wordCount: 3, fallbackIndex: 2 }), "verse-1:gloss:2");
});
