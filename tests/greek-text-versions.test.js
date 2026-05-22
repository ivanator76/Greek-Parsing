import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GREEK_TEXT_VERSION_ID,
  allGreekTextVersions,
  greekTextSourceLabel,
  parseImportedGreekTextVersion,
  selectedGreekTextVersion
} from "../src/greek-text-versions.js";

test("parseImportedGreekTextVersion accepts a user-provided NA28 or UBS5 map", () => {
  const imported = parseImportedGreekTextVersion(JSON.stringify({
    name: "NA28 personal copy",
    source: "User licensed NA28",
    verses: {
      "John.3.16": "Οὕτως γὰρ ἠγάπησεν",
      "bad-key": "ignored",
      "John.3.17": ""
    }
  }), { id: "custom-na28" });

  assert.equal(imported.id, "custom-na28");
  assert.equal(imported.name, "NA28 personal copy");
  assert.deepEqual(imported.verses, {
    "John.3.16": "Οὕτως γὰρ ἠγάπησεν"
  });
});

test("parseImportedGreekTextVersion requires a name and verse text", () => {
  assert.throws(() => parseImportedGreekTextVersion(JSON.stringify({ verses: { "John.3.16": "x" } })), /name/);
  assert.throws(() => parseImportedGreekTextVersion(JSON.stringify({ name: "UBS5" })), /verses/);
});

test("selectedGreekTextVersion falls back to Tischendorf", () => {
  const versions = allGreekTextVersions([]);
  const selected = selectedGreekTextVersion({ versions, selectedId: "missing" });

  assert.equal(selected.id, DEFAULT_GREEK_TEXT_VERSION_ID);
  assert.equal(greekTextSourceLabel(selected), "希臘原文：Tischendorf Greek New Testament");
});

test("greekTextSourceLabel includes source detail for imported text", () => {
  assert.equal(
    greekTextSourceLabel({ name: "UBS5 personal copy", source: "User-provided text" }),
    "希臘原文：UBS5 personal copy (User-provided text)"
  );
});
