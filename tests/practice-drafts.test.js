import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPracticeDraft,
  clearPracticeDraft,
  createPracticeDraft,
  loadPracticeDrafts,
  PRACTICE_DRAFT_STORAGE_KEY,
  savePracticeDraft,
  savePracticeDrafts
} from "../src/practice-drafts.js";
import { createBlankExercise } from "../src/worksheet.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

function verse(reference = "Heb 3:7") {
  return {
    ...createBlankExercise({
      id: "verse-1",
      reference,
      greek: "Καθως λεγει το πνευμα"
    }),
    syntax: ["S", "V", "D", "N"],
    morphology: ["ADV", "VIPA3S", "DNNS", "NNNS"],
    gloss: ["照著", "說", "這", "靈"],
    translation: "聖靈如此說",
    lineBreaks: [1],
    lineTranslations: { 0: "照著他說", 2: "這靈" }
  };
}

test("createPracticeDraft stores answer rows and manual line breaks by verse reference", () => {
  const draft = createPracticeDraft("lesson-1", [verse()], "2026-05-10T00:00:00.000Z");

  assert.equal(draft.lessonId, "lesson-1");
  assert.deepEqual(draft.answers["Heb 3:7"].syntax, ["S", "V", "D", "N"]);
  assert.equal(draft.answers["Heb 3:7"].translation, "聖靈如此說");
  assert.deepEqual(draft.layout["Heb 3:7"].lineBreaks, [1]);
  assert.deepEqual(draft.layout["Heb 3:7"].lineTranslations, { 0: "照著他說", 2: "這靈" });
});

test("applyPracticeDraft restores saved answers and manual line breaks onto freshly loaded lesson verses", () => {
  const blank = createBlankExercise({
    id: "fresh-id",
    reference: "Heb 3:7",
    greek: "Καθως λεγει το πνευμα"
  });
  const draft = createPracticeDraft("lesson-1", [verse()]);
  const [restored] = applyPracticeDraft([blank], draft);

  assert.equal(restored.id, "fresh-id");
  assert.deepEqual(restored.syntax, ["S", "V", "D", "N"]);
  assert.equal(restored.translation, "聖靈如此說");
  assert.deepEqual(restored.lineBreaks, [1]);
  assert.deepEqual(restored.lineTranslations, { 0: "照著他說", 2: "這靈" });
});

test("savePracticeDraft overwrites the draft for one lesson without touching others", () => {
  const drafts = {
    "lesson-2": createPracticeDraft("lesson-2", [verse("Jas 1:1")])
  };
  const updated = savePracticeDraft(drafts, "lesson-1", [verse()]);

  assert.equal(Object.keys(updated).length, 2);
  assert.equal(updated["lesson-1"].answers["Heb 3:7"].translation, "聖靈如此說");
  assert.equal(updated["lesson-2"].answers["Jas 1:1"].translation, "聖靈如此說");
});

test("clearPracticeDraft removes only the selected lesson draft", () => {
  const drafts = {
    "lesson-1": createPracticeDraft("lesson-1", [verse()]),
    "lesson-2": createPracticeDraft("lesson-2", [verse("Jas 1:1")])
  };

  assert.deepEqual(Object.keys(clearPracticeDraft(drafts, "lesson-1")), ["lesson-2"]);
});

test("practice drafts round trip through local storage", () => {
  const storage = memoryStorage();
  const drafts = { "lesson-1": createPracticeDraft("lesson-1", [verse()]) };

  savePracticeDrafts(drafts, storage);

  assert.deepEqual(JSON.parse(storage.getItem(PRACTICE_DRAFT_STORAGE_KEY)), drafts);
  assert.deepEqual(loadPracticeDrafts(storage), drafts);
});
