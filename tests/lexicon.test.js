import assert from "node:assert/strict";
import test from "node:test";
import { formatMorphology, lookupWord, makeExternalLookupUrl } from "../src/lexicon.js";

test("lookupWord returns local lemma and morphology when study tools are used", async () => {
  const result = await lookupWord({
    reference: "Heb 3:7",
    wordIndex: 1,
    word: "καθὼς"
  });

  assert.equal(result.source, "local");
  assert.equal(result.lemma, "καθώς");
  assert.equal(result.morphology, "ADV");
  assert.equal(result.strong, "2531");
});

test("formatMorphology uses classroom order for noun-related forms", () => {
  assert.equal(formatMorphology("N-GSM"), "NGMS");
  assert.equal(formatMorphology("T-NSM"), "DNMS");
  assert.equal(formatMorphology("A-APF"), "AAFP");
});

test("formatMorphology uses mood-tense-voice order for verbs and participles", () => {
  assert.equal(formatMorphology("V-PAI-1S"), "VIPA1S");
  assert.equal(formatMorphology("V-AAN"), "VNAA");
  assert.equal(formatMorphology("V-PAP-NSM"), "VPPANMS");
});

test("lookupWord falls back to a safe no-result object for missing local entries", async () => {
  const result = await lookupWord({
    reference: "Heb 3:7",
    wordIndex: 99,
    word: "missing"
  });

  assert.equal(result.source, "none");
  assert.equal(result.lemma, "");
});

test("makeExternalLookupUrl creates an explicit web lookup URL", () => {
  assert.equal(
    makeExternalLookupUrl("πνεῦμα"),
    "https://logeion.uchicago.edu/%CF%80%CE%BD%CE%B5%E1%BF%A6%CE%BC%CE%B1"
  );
});
