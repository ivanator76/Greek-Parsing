import assert from "node:assert/strict";
import test from "node:test";
import { createWorksheetDocxBlob } from "../src/docx-export.js";
import { createBlankExercise } from "../src/worksheet.js";

function verse() {
  return {
    ...createBlankExercise({
      id: "verse-1",
      reference: "Mark 3:14",
      greek: "και εποιησεν δωδεκα ους και αποστολους"
    }),
    syntax: ["", "", "V+A", "V+A", "", "NP~Adj"],
    morphology: ["C", "VIAA3S", "NAMP", "PAMP", "C", "NAMP"],
    gloss: ["和", "他曾做", "十二", "他們", "和", "使徒們"],
    translation: "他設立十二個人，也稱他們為使徒。",
    lineBreaks: [2],
    lineTranslations: {
      0: "他設立十二個人",
      3: "也稱他們為使徒"
    },
    wordColors: { 1: "yellow", 3: "red" }
  };
}

test("createWorksheetDocxBlob creates a Word document package", async () => {
  const blob = createWorksheetDocxBlob({
    verses: [verse()],
    translationMode: "verse",
    maxColumns: 6,
    pageOrientation: "landscape"
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = new TextDecoder().decode(bytes);

  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.match(text, /\[Content_Types\]\.xml/);
  assert.match(text, /word\/document\.xml/);
  assert.match(text, /Mark 3:14/);
  assert.match(text, /希臘原文：SBL Greek New Testament/);
  assert.match(text, /CC BY 4\.0/);
  assert.match(text, /και/);
  assert.match(text, /整句翻譯 他設立十二個人，也稱他們為使徒。/);
  assert.match(text, /<w:shd w:fill="FFF3A3"/);
  assert.match(text, /<w:shd w:fill="FECACA"/);
  assert.match(text, /<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"\/>/);
  assert.doesNotMatch(text, /<w:pgSz w:w="12240" w:h="15840"\/>/);
  assert.doesNotMatch(text, /\[空\]/);
  assert.doesNotMatch(text, /<w:tbl>/);
  assert.doesNotMatch(text, /<w:tc>/);
  assert.match(text, /<w:tab\/>/);
});

test("createWorksheetDocxBlob can create portrait A4 pages", async () => {
  const blob = createWorksheetDocxBlob({
    verses: [verse()],
    translationMode: "verse",
    maxColumns: 6,
    pageOrientation: "portrait"
  });
  const text = new TextDecoder().decode(await blob.arrayBuffer());

  assert.match(text, /<w:pgSz w:w="11906" w:h="16838"\/>/);
});

test("createWorksheetDocxBlob adds lesson name in the header and page number in the footer", async () => {
  const blob = createWorksheetDocxBlob({
    verses: [verse()],
    lessonName: "馬可福音第三課",
    translationMode: "verse",
    maxColumns: 6,
    pageOrientation: "landscape"
  });
  const text = new TextDecoder().decode(await blob.arrayBuffer());

  assert.match(text, /word\/_rels\/document\.xml\.rels/);
  assert.match(text, /word\/header1\.xml/);
  assert.match(text, /word\/footer1\.xml/);
  assert.match(text, /<w:headerReference w:type="default" r:id="rIdHeader1"\/>/);
  assert.match(text, /<w:footerReference w:type="default" r:id="rIdFooter1"\/>/);
  assert.match(text, /馬可福音第三課/);
  assert.match(text, /PAGE/);
  assert.match(text, /NUMPAGES/);
});

test("createWorksheetDocxBlob follows line translation mode and expanded answers", async () => {
  const blob = createWorksheetDocxBlob({
    verses: [verse()],
    translationMode: "line",
    maxColumns: 6,
    standardAnswers: {
      "Mark 3:14": {
        syntax: ["", "", "V+A"],
        morphology: ["C"],
        gloss: ["和"],
        translation: "標準答案"
      }
    },
    expandedStandardAnswers: { "Mark 3:14": true }
  });
  const text = new TextDecoder().decode(await blob.arrayBuffer());

  assert.match(text, /本行翻譯 他設立十二個人/);
  assert.match(text, /已顯示標準答案/);
  assert.match(text, /整句 標準答案/);
});
