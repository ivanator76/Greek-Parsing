import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GREEK_TEXT_VERSION_ID,
  allGreekTextVersions,
  greekTextSourceLabel,
  normalizeVerseMapWithStats,
  parseImportedGreekTextVersion,
  saveCustomGreekTextVersions,
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
  assert.deepEqual(imported.importStats, { validCount: 1, skippedCount: 2 });
});

test("parseImportedGreekTextVersion requires a name and verse text", () => {
  assert.throws(() => parseImportedGreekTextVersion(JSON.stringify({ verses: { "John.3.16": "x" } })), /name/);
  assert.throws(() => parseImportedGreekTextVersion(JSON.stringify({ name: "UBS5" })), /verses/);
});

test("OpenGNT is the only built-in Greek text version", () => {
  const versions = allGreekTextVersions([]);
  const selected = selectedGreekTextVersion({ versions, selectedId: "missing" });

  assert.equal(selected.id, DEFAULT_GREEK_TEXT_VERSION_ID);
  assert.equal(selected.id, "opengnt");
  assert.equal(versions.length, 1);
  assert.equal(Object.keys(selected.verses).length, 7941);
  assert.match(selected.verses["1 John.4.19"], /^Ἡμεῖς ἀγαπῶμεν/);
  assert.match(greekTextSourceLabel(selected), /希臘原文：Open Greek New Testament/);
  assert.match(greekTextSourceLabel(selected), /CC BY-SA 4\.0/);
});

test("verse map normalization reports every skipped key", () => {
  const result = normalizeVerseMapWithStats({
    "John.3.16": "Οὕτως",
    "John 3:17": "οὐ",
    "1Cor.13.4": "Ἡ",
    "John.3.18": ""
  });

  assert.deepEqual(result.verses, { "John.3.16": "Οὕτως" });
  assert.equal(result.validCount, 1);
  assert.equal(result.skippedCount, 3);
});

test("custom text storage reports quota exhaustion clearly", () => {
  const storage = {
    setItem() {
      const error = new Error("full");
      error.name = "QuotaExceededError";
      throw error;
    }
  };

  assert.throws(() => saveCustomGreekTextVersions([], storage), /本機儲存空間不足/);
});

test("greekTextSourceLabel includes source detail for imported text", () => {
  assert.equal(
    greekTextSourceLabel({ name: "UBS5 personal copy", source: "User-provided text" }),
    "希臘原文：UBS5 personal copy (User-provided text)"
  );
});
