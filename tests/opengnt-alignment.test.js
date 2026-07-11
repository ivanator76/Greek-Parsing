import assert from "node:assert/strict";
import test from "node:test";
import { LEXICON_ENTRIES } from "../src/lexicon-data.js";
import { splitWords } from "../src/layout.js";
import { NT_BOOKS } from "../src/nt.js";
import { OPENGNT_VERSE_TEXTS } from "../src/opengnt-texts.js";

test("every OpenGNT display token is aligned to the same-position lexicon entry", () => {
  let wordCount = 0;

  for (const [verseKey, greek] of Object.entries(OPENGNT_VERSE_TEXTS)) {
    const match = verseKey.match(/^(.+)\.(\d+)\.(\d+)$/);
    assert.ok(match, `invalid verse key: ${verseKey}`);
    const [, bookId, chapter, verse] = match;
    const book = NT_BOOKS.find((item) => item.id === bookId);
    assert.ok(book, `unknown book: ${bookId}`);
    const reference = `${book.short} ${chapter}:${verse}`;

    splitWords(greek).forEach((word, index) => {
      const entry = LEXICON_ENTRIES[`${reference}.${index}`];
      assert.ok(entry, `missing lexicon entry for ${reference}.${index}`);
      assert.equal(entry.form, word, `misaligned form at ${reference}.${index}`);
      wordCount += 1;
    });
  }

  assert.equal(Object.keys(OPENGNT_VERSE_TEXTS).length, 7941);
  assert.equal(wordCount, 138013);
  assert.equal(Object.keys(LEXICON_ENTRIES).length, wordCount);
});
