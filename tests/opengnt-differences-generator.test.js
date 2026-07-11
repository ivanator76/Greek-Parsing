import assert from "node:assert/strict";
import test from "node:test";
import {
  parseWordDifferences,
  parseWordOrderReferences
} from "../scripts/generate-opengnt-na28-differences.js";

test("OpenGNT difference parser groups multiple words by scripture reference", () => {
  const parsed = parseWordDifferences([
    "Book\tChapter\tVerse\tOGNT\tTANTT",
    "43\t2\t15\tτὰ\tτὸ",
    "43\t2\t15\tκέρματα\tκέρμα",
    "44\t1\t11\tβλέποντες\tἐμβλέποντες"
  ].join("\n"));

  assert.deepEqual(parsed, [
    {
      reference: "John 2:15",
      differences: [
        { openGnt: "τὰ", comparison: "τὸ" },
        { openGnt: "κέρματα", comparison: "κέρμα" }
      ]
    },
    {
      reference: "Acts 1:11",
      differences: [{ openGnt: "βλέποντες", comparison: "ἐμβλέποντες" }]
    }
  ]);
});

test("OpenGNT word-order parser extracts each affected verse", () => {
  const parsed = parseWordOrderReferences([
    "OGNTsort\tOGNT\tTANTT\tVerse",
    "019626\tχειρα\tξηραν\t〔41｜3｜3〕",
    "019627\tεχοντι\tχειρα\t",
    "043710\tταυτα\tδε\t〔42｜18｜4〕"
  ].join("\n"));

  assert.deepEqual(parsed, ["Mark 3:3", "Luke 18:4"]);
});
