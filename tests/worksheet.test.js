import assert from "node:assert/strict";
import test from "node:test";
import { createBlankExercise } from "../src/worksheet.js";

test("createBlankExercise loads Greek words while leaving all student answer rows blank", () => {
  const verse = createBlankExercise({
    reference: "Heb 3:7",
    greek: "Καθως λεγει το πνευμα το αγιον"
  });

  assert.deepEqual(verse.words, ["Καθως", "λεγει", "το", "πνευμα", "το", "αγιον"]);
  assert.deepEqual(verse.syntax, ["", "", "", "", "", ""]);
  assert.deepEqual(verse.morphology, ["", "", "", "", "", ""]);
  assert.deepEqual(verse.gloss, ["", "", "", "", "", ""]);
  assert.equal(verse.translation, "");
});
