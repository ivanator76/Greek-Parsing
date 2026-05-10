import assert from "node:assert/strict";
import test from "node:test";
import {
  clearAllAnswers,
  clearPracticePage,
  clearVerseAnswers,
  createLessonRecord,
  hydrateLesson,
  normalizeLessonName
} from "../src/lessons.js";
import { createBlankExercise } from "../src/worksheet.js";

function filledVerse() {
  return {
    ...createBlankExercise({
      id: "verse-1",
      reference: "Heb 3:7",
      greek: "Καθως λεγει το πνευμα"
    }),
    syntax: ["S", "V", "D", "N"],
    morphology: ["ADV", "VIPA3S", "DNNS", "NNNS"],
    gloss: ["照著", "說", "這", "靈"],
    translation: "聖靈如此說"
  };
}

test("normalizeLessonName trims names and collapses internal whitespace", () => {
  assert.equal(normalizeLessonName("  第  1  課  "), "第 1 課");
});

test("createLessonRecord saves references and Greek text without answers", () => {
  const lesson = createLessonRecord({
    id: "lesson-1",
    name: "第 1 課",
    verses: [filledVerse()]
  });

  assert.equal(lesson.name, "第 1 課");
  assert.deepEqual(lesson.items, [
    {
      reference: "Heb 3:7",
      greek: "Καθως λεγει το πνευμα"
    }
  ]);
  assert.equal(lesson.items[0].translation, undefined);
  assert.equal(lesson.items[0].syntax, undefined);
});

test("hydrateLesson rebuilds blank exercises from saved lesson items", () => {
  const [verse] = hydrateLesson({
    id: "lesson-1",
    name: "第 1 課",
    items: [{ reference: "Heb 3:7", greek: "Καθως λεγει το πνευμα" }]
  }, () => "fresh-id");

  assert.equal(verse.id, "fresh-id");
  assert.equal(verse.reference, "Heb 3:7");
  assert.deepEqual(verse.syntax, ["", "", "", ""]);
  assert.deepEqual(verse.morphology, ["", "", "", ""]);
  assert.deepEqual(verse.gloss, ["", "", "", ""]);
  assert.equal(verse.translation, "");
});

test("clearVerseAnswers clears student rows while keeping Greek text", () => {
  const cleared = clearVerseAnswers(filledVerse());

  assert.equal(cleared.reference, "Heb 3:7");
  assert.equal(cleared.greek, "Καθως λεγει το πνευμα");
  assert.deepEqual(cleared.syntax, ["", "", "", ""]);
  assert.deepEqual(cleared.morphology, ["", "", "", ""]);
  assert.deepEqual(cleared.gloss, ["", "", "", ""]);
  assert.equal(cleared.translation, "");
});

test("clearAllAnswers clears every verse on the current page", () => {
  const verses = clearAllAnswers([filledVerse(), filledVerse()]);

  assert.equal(verses.length, 2);
  assert.deepEqual(verses[0].syntax, ["", "", "", ""]);
  assert.deepEqual(verses[1].morphology, ["", "", "", ""]);
});

test("clearPracticePage starts a blank page without deleting saved lessons or answers", () => {
  const state = {
    verses: [filledVerse()],
    selected: { verseId: "verse-1", wordIndex: 2 },
    selectedLessonId: "lesson-1",
    activeLessonId: "lesson-1",
    lessonName: "第 1 課",
    lessons: [{ id: "lesson-1", name: "第 1 課", items: [] }],
    practiceDrafts: { "lesson-1": { lessonId: "lesson-1" } },
    standardAnswers: { "Heb 3:7": { reference: "Heb 3:7" } },
    expandedStandardAnswers: { "Heb 3:7": true }
  };

  const next = clearPracticePage(state);

  assert.deepEqual(next.verses, []);
  assert.deepEqual(next.selected, { verseId: null, wordIndex: 0 });
  assert.equal(next.selectedLessonId, "");
  assert.equal(next.activeLessonId, "");
  assert.equal(next.lessonName, "");
  assert.deepEqual(next.lessons, state.lessons);
  assert.deepEqual(next.practiceDrafts, state.practiceDrafts);
  assert.deepEqual(next.standardAnswers, state.standardAnswers);
  assert.deepEqual(next.expandedStandardAnswers, {});
});
