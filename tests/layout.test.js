import assert from "node:assert/strict";
import test from "node:test";
import {
  createVerse,
  splitWords,
  toggleLineBreakAfter,
  updateVerseGreek,
  updateVerseLineTranslation,
  wrapVerse
} from "../src/layout.js";

test("splitWords keeps Greek punctuation with each word", () => {
  assert.deepEqual(splitWords("Οι δε οχλοι ελεγον, Ουτος εστιν."), [
    "Οι",
    "δε",
    "οχλοι",
    "ελεγον,",
    "Ουτος",
    "εστιν."
  ]);
});

test("wrapVerse repeats syntax rows for each Greek segment and keeps final translation only on last segment", () => {
  const verse = createVerse({
    reference: "Matt 21:11",
    greek: "Οι δε οχλοι ελεγον Ουτος εστιν ο προφητης",
    syntax: ["S", "", "S", "V+N", "S", "V", "", "NP+G"],
    morphology: ["DNMP", "C", "NNMP", "VIIP3P", "JNMS", "VIPA3S", "DNMS", "NNMS"],
    gloss: ["那些", "但是", "群眾", "一直說", "這", "他是", "那", "先知"],
    translation: "但是群眾一直說，這是先知"
  });

  const segments = wrapVerse(verse, { maxColumns: 4 });

  assert.equal(segments.length, 2);
  assert.deepEqual(segments.map((segment) => segment.words), [
    ["Οι", "δε", "οχλοι", "ελεγον"],
    ["Ουτος", "εστιν", "ο", "προφητης"]
  ]);
  assert.deepEqual(segments[0].syntax, ["S", "", "S", "V+N"]);
  assert.deepEqual(segments[1].syntax, ["S", "V", "", "NP+G"]);
  assert.equal(segments[0].showTranslation, false);
  assert.equal(segments[1].showTranslation, true);
  assert.equal(segments[1].translation, "但是群眾一直說，這是先知");
});

test("wrapVerse uses manual line breaks when a verse has them", () => {
  const verse = createVerse({
    reference: "Mark 3:14",
    greek: "και εποιησεν δωδεκα ους και αποστολους ονομασεν",
    lineBreaks: [2, 5],
    lineTranslations: { 0: "第一行", 3: "第二行" }
  });

  const segments = wrapVerse(verse, { maxColumns: 8 });

  assert.deepEqual(segments.map((segment) => segment.words), [
    ["και", "εποιησεν", "δωδεκα"],
    ["ους", "και", "αποστολους"],
    ["ονομασεν"]
  ]);
  assert.deepEqual(segments.map((segment) => segment.start), [0, 3, 6]);
  assert.deepEqual(segments.map((segment) => segment.lineTranslation), ["第一行", "第二行", ""]);
});

test("updateVerseLineTranslation stores a translation for the line starting at a word index", () => {
  const verse = createVerse({
    reference: "Mark 3:14",
    greek: "και εποιησεν δωδεκα"
  });

  const updated = updateVerseLineTranslation(verse, 0, "他設立了十二個人");

  assert.deepEqual(updated.lineTranslations, { 0: "他設立了十二個人" });
});

test("updateVerseGreek clears manual line breaks because word indexes may change", () => {
  const verse = createVerse({
    reference: "Mark 3:14",
    greek: "και εποιησεν δωδεκα",
    lineBreaks: [1]
  });

  const updated = updateVerseGreek(verse, "και εποιησεν");

  assert.deepEqual(updated.lineBreaks, []);
});

test("toggleLineBreakAfter adds and removes a manual break after a word", () => {
  const verse = createVerse({
    reference: "Mark 3:14",
    greek: "και εποιησεν δωδεκα"
  });

  const withBreak = toggleLineBreakAfter(verse, 1);
  const withoutBreak = toggleLineBreakAfter(withBreak, 1);

  assert.deepEqual(withBreak.lineBreaks, [1]);
  assert.deepEqual(withoutBreak.lineBreaks, []);
});
