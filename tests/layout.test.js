import assert from "node:assert/strict";
import test from "node:test";
import { createVerse, splitWords, wrapVerse } from "../src/layout.js";

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
