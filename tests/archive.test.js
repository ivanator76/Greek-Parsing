import assert from "node:assert/strict";
import test from "node:test";
import {
  createDataArchive,
  importSummary,
  mergeImportedData,
  parseDataArchive
} from "../src/archive.js";

const lessonA = { id: "lesson-a", name: "第 1 課", items: [] };
const lessonB = { id: "lesson-b", name: "第 2 課", items: [] };

test("createDataArchive stores the portable app data with a version marker", () => {
  const archive = createDataArchive({
    lessons: [lessonA],
    practiceDrafts: { "lesson-a": { lessonId: "lesson-a" } },
    standardAnswers: { "Heb 3:7": { reference: "Heb 3:7" } }
  }, "2026-05-22T00:00:00.000Z");

  assert.equal(archive.app, "greek-parsing");
  assert.equal(archive.version, 1);
  assert.equal(archive.exportedAt, "2026-05-22T00:00:00.000Z");
  assert.deepEqual(archive.data.lessons, [lessonA]);
  assert.deepEqual(archive.data.practiceDrafts, { "lesson-a": { lessonId: "lesson-a" } });
  assert.deepEqual(archive.data.standardAnswers, { "Heb 3:7": { reference: "Heb 3:7" } });
});

test("parseDataArchive rejects files that are not Greek Parsing backups", () => {
  assert.throws(() => parseDataArchive("{}"), /不是 Greek Parsing 存檔/);
  assert.throws(() => parseDataArchive("{bad json"), /無法讀取/);
});

test("mergeImportedData replaces matching lessons and merges draft and answer maps", () => {
  const merged = mergeImportedData({
    lessons: [{ ...lessonA, name: "舊名稱" }],
    practiceDrafts: { "lesson-a": { lessonId: "lesson-a", old: true } },
    standardAnswers: { "Heb 3:7": { reference: "Heb 3:7", old: true } }
  }, {
    lessons: [lessonA, lessonB],
    practiceDrafts: { "lesson-a": { lessonId: "lesson-a", imported: true } },
    standardAnswers: { "Heb 3:8": { reference: "Heb 3:8" } }
  });

  assert.deepEqual(merged.lessons, [lessonA, lessonB]);
  assert.deepEqual(merged.practiceDrafts, { "lesson-a": { lessonId: "lesson-a", imported: true } });
  assert.deepEqual(merged.standardAnswers, {
    "Heb 3:7": { reference: "Heb 3:7", old: true },
    "Heb 3:8": { reference: "Heb 3:8" }
  });
});

test("importSummary reports how many records an archive contains", () => {
  assert.equal(importSummary({
    lessons: [lessonA, lessonB],
    practiceDrafts: { "lesson-a": {}, "lesson-b": {} },
    standardAnswers: { "Heb 3:7": {} }
  }), "將匯入 2 組課程、2 份草稿、1 節標準答案。");
});
