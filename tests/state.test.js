import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../src/state.js";

test("initial app state starts with no exercises and only the page panel visible", () => {
  const state = createInitialState();

  assert.deepEqual(state.verses, []);
  assert.equal(state.activeTool, "本頁");
  assert.equal(state.showStudyTools, false);
  assert.equal(state.pageOrientation, "landscape");
});
