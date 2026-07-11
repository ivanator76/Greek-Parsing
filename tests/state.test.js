import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState } from "../src/state.js";

test("initial app state starts with no exercises and only the page panel visible", () => {
  const state = createInitialState();

  assert.deepEqual(state.verses, []);
  assert.equal(state.activeTool, "本頁");
  assert.equal(state.showStudyTools, false);
  assert.equal(state.pageOrientation, "landscape");
  assert.equal(state.layoutDensity, "standard");
  assert.equal(state.translationMode, "line");
  assert.equal(state.reflowMode, false);
  assert.equal(state.projectionMode, false);
  assert.equal(state.sidePanelCollapsed, false);
  assert.equal(state.greekEditor, null);
  assert.equal("customGreekTextVersions" in state, false);
  assert.equal("selectedGreekTextVersionId" in state, false);
});
