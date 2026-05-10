import assert from "node:assert/strict";
import test from "node:test";
import {
  createStandardAnswer,
  hasStandardAnswer,
  loadStandardAnswers,
  saveStandardAnswer,
  saveStandardAnswers,
  STANDARD_ANSWER_STORAGE_KEY
} from "../src/standard-answers.js";
import { createBlankExercise } from "../src/worksheet.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

function filledVerse(reference = "Heb 3:7") {
  return {
    ...createBlankExercise({
      id: "verse-1",
      reference,
      greek: "Καθως λεγει το πνευμα"
    }),
    syntax: ["S", "V", "D", "N"],
    morphology: ["ADV", "VIPA3S", "DNNS", "NNNS"],
    gloss: ["照著", "說", "這", "靈"],
    translation: "聖靈如此說"
  };
}

test("createStandardAnswer captures answer rows for one verse", () => {
  const answer = createStandardAnswer(filledVerse());

  assert.equal(answer.reference, "Heb 3:7");
  assert.deepEqual(answer.syntax, ["S", "V", "D", "N"]);
  assert.deepEqual(answer.morphology, ["ADV", "VIPA3S", "DNNS", "NNNS"]);
  assert.deepEqual(answer.gloss, ["照著", "說", "這", "靈"]);
  assert.equal(answer.translation, "聖靈如此說");
});

test("saveStandardAnswer stores by reference and overwrites previous answer", () => {
  const answers = {
    "Heb 3:7": createStandardAnswer(filledVerse())
  };
  const updated = saveStandardAnswer(answers, {
    ...filledVerse(),
    syntax: ["S2", "V2", "", ""],
    translation: "新的標準答案"
  });

  assert.equal(Object.keys(updated).length, 1);
  assert.deepEqual(updated["Heb 3:7"].syntax, ["S2", "V2", "", ""]);
  assert.equal(updated["Heb 3:7"].translation, "新的標準答案");
});

test("hasStandardAnswer reports whether a reference has a saved answer", () => {
  const answers = { "Heb 3:7": createStandardAnswer(filledVerse()) };

  assert.equal(hasStandardAnswer(answers, "Heb 3:7"), true);
  assert.equal(hasStandardAnswer(answers, "Heb 3:8"), false);
});

test("loadStandardAnswers and saveStandardAnswers round trip local storage data", () => {
  const storage = memoryStorage();
  const answers = { "Heb 3:7": createStandardAnswer(filledVerse()) };

  saveStandardAnswers(answers, storage);

  assert.deepEqual(JSON.parse(storage.getItem(STANDARD_ANSWER_STORAGE_KEY)), answers);
  assert.deepEqual(loadStandardAnswers(storage), answers);
});
