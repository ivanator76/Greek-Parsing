import assert from "node:assert/strict";
import test from "node:test";
import { formatWorksheetText } from "../src/text-export.js";
import { createBlankExercise } from "../src/worksheet.js";

function verse() {
  return {
    ...createBlankExercise({
      id: "verse-1",
      reference: "1 John 4:19",
      greek: "ημεις αγαπωμεν οτι αυτος πρωτος ηγαπησεν ημας"
    }),
    syntax: ["S", "", "", "S", "", "", "V+A"],
    morphology: ["PNMP", "VIPA1P", "C", "JNMS", "ANMS", "VIAA3S", "PAMP"],
    gloss: ["我們", "我們愛", "因為", "他", "第一", "他曾愛", "我們"],
    translation: "我們愛，因為他先愛了我們。",
    lineBreaks: [2, 5],
    lineTranslations: {
      0: "我們愛，因為",
      3: "他先愛了",
      6: "我們。"
    }
  };
}

test("formatWorksheetText exports the current worksheet with verse-level translation", () => {
  const text = formatWorksheetText({
    verses: [verse()],
    translationMode: "verse",
    maxColumns: 6
  });

  assert.match(text, /Koine Greek Parsing/);
  assert.match(text, /1 John 4:19/);
  assert.match(text, /2\s+ημεις \| αγαπωμεν \| οτι/);
  assert.match(text, /5 整句翻譯\s+我們愛，因為他先愛了我們。/);
  assert.doesNotMatch(text, /本行翻譯/);
});

test("formatWorksheetText leaves empty cells blank", () => {
  const text = formatWorksheetText({
    verses: [verse()],
    translationMode: "verse",
    maxColumns: 6
  });

  assert.doesNotMatch(text, /\[空\]/);
  assert.match(text, /^1 S \|  \| $/m);
});

test("formatWorksheetText follows line translation mode", () => {
  const text = formatWorksheetText({
    verses: [verse()],
    translationMode: "line",
    maxColumns: 6
  });

  assert.match(text, /5 本行翻譯\s+我們愛，因為/);
  assert.match(text, /5 本行翻譯\s+他先愛了/);
  assert.match(text, /5 本行翻譯\s+我們。/);
});

test("formatWorksheetText includes standard answers only when they are expanded", () => {
  const text = formatWorksheetText({
    verses: [verse()],
    translationMode: "verse",
    maxColumns: 6,
    standardAnswers: {
      "1 John 4:19": {
        syntax: ["S", "", "", "S", "", "", "V+A"],
        morphology: ["PNMP"],
        gloss: ["我們"],
        translation: "標準答案翻譯"
      }
    },
    expandedStandardAnswers: { "1 John 4:19": true }
  });

  assert.match(text, /已顯示標準答案/);
  assert.match(text, /整句\s+標準答案翻譯/);
});
