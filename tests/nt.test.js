import assert from "node:assert/strict";
import test from "node:test";
import { VERSE_TEXTS, books, chaptersFor, getGreekText, referenceFor, versesFor } from "../src/nt.js";

test("NT reference picker includes the full New Testament structure", () => {
  assert.equal(books().length, 27);
  assert.equal(chaptersFor("Matthew").length, 28);
  assert.equal(versesFor("Matthew", "1").length, 25);
  assert.equal(chaptersFor("Revelation").length, 22);
  assert.equal(versesFor("Revelation", "22").length, 21);
});

test("referenceFor uses compact classroom-friendly book labels", () => {
  assert.equal(referenceFor({ book: "Hebrews", chapter: "3", verse: "7" }), "Heb 3:7");
});

test("getGreekText returns empty string for verses whose source text has not been imported yet", () => {
  assert.equal(getGreekText({ book: "Matthew", chapter: "99", verse: "1" }), "");
});

test("imported local Tischendorf text includes common classroom references", () => {
  assert.equal(Object.keys(VERSE_TEXTS).length, 7958);
  assert.match(getGreekText({ book: "Hebrews", chapter: "3", verse: "7" }), /^Διό,/);
  assert.match(getGreekText({ book: "Matthew", chapter: "21", verse: "11" }), /προφήτης/);
  assert.match(getGreekText({ book: "Revelation", chapter: "22", verse: "21" }), /Ἰησοῦ/);
});
