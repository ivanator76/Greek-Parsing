import assert from "node:assert/strict";
import test from "node:test";
import { generateOpenGntData } from "../scripts/generate-opengnt.js";

test("OpenGNT generator creates text and lexicon entries from the same tokens", () => {
  const csv = [
    "header",
    "000001\t000001\t000001\tc1\t-\t〔1｜1｜1〕\t〔40｜1｜1〕\t〔βιβλοϲ｜Βιβλος｜Βίβλος｜βίβλος｜N-NSF｜G976〕\t〔〕\t〔〕\t〔〕\t〔｜〕",
    "000002\t000002\t000002\tc1\t-\t〔2｜2｜2〕\t〔40｜1｜1〕\t〔γενεϲεωϲ｜γενεσεως｜γενέσεως｜γένεσις｜N-GSF｜G1078〕\t〔〕\t〔〕\t〔〕\t〔<pm>¬</pm>｜<pm>,</pm><pm>¶</pm>〕"
  ].join("\n");

  const generated = generateOpenGntData(csv);

  assert.equal(generated.verses["Matthew.1.1"], "Βίβλος γενέσεως,");
  assert.deepEqual(generated.lexiconEntries["Matt 1:1.1"], {
    form: "γενέσεως,",
    normalized: "γενεσεως",
    lemma: "γένεσις",
    morphology: "N-GSF",
    strong: "1078"
  });
});
