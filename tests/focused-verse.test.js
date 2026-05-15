import assert from "node:assert/strict";
import test from "node:test";
import { focusedVerseId, preferredVerseIdForEditing } from "../src/focused-verse.js";

test("focusedVerseId returns the verse id from the active input dataset", () => {
  assert.equal(focusedVerseId({ dataset: { verseId: "verse-2" } }), "verse-2");
});

test("preferredVerseIdForEditing uses the focused verse before the selected verse", () => {
  assert.equal(preferredVerseIdForEditing({
    activeElement: { dataset: { verseId: "verse-2" } },
    selectedVerseId: "verse-1"
  }), "verse-2");
});

test("preferredVerseIdForEditing falls back to the selected verse without a focused verse", () => {
  assert.equal(preferredVerseIdForEditing({
    activeElement: { dataset: {} },
    selectedVerseId: "verse-1"
  }), "verse-1");
});
