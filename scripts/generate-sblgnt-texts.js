import { writeFile } from "node:fs/promises";

const FILES = [
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1Cor", "2Cor", "Gal",
  "Eph", "Phil", "Col", "1Thess", "2Thess", "1Tim", "2Tim", "Titus",
  "Phlm", "Heb", "Jas", "1Pet", "2Pet", "1John", "2John", "3John",
  "Jude", "Rev"
];

const BOOKS = {
  Matt: "Matthew",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Rom: "Romans",
  "1Cor": "1 Corinthians",
  "2Cor": "2 Corinthians",
  Gal: "Galatians",
  Eph: "Ephesians",
  Phil: "Philippians",
  Col: "Colossians",
  "1Thess": "1 Thessalonians",
  "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy",
  "2Tim": "2 Timothy",
  Titus: "Titus",
  Phlm: "Philemon",
  Heb: "Hebrews",
  Jas: "James",
  "1Pet": "1 Peter",
  "2Pet": "2 Peter",
  "1John": "1 John",
  "2John": "2 John",
  "3John": "3 John",
  Jude: "Jude",
  Rev: "Revelation"
};

const SOURCE_BASE = "https://raw.githubusercontent.com/Faithlife/SBLGNT/master/data/sblgnt/text";

const verseTexts = {};

for (const file of FILES) {
  const response = await fetch(`${SOURCE_BASE}/${file}.txt`);
  if (!response.ok) throw new Error(`Could not fetch ${file}: ${response.status}`);
  const text = await response.text();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^\s]+)\s+(\d+):(\d+)\t(.+)$/);
    if (!match) continue;
    const [, sourceBook, chapter, verse, greekRaw] = match;
    const book = BOOKS[sourceBook];
    if (!book) throw new Error(`Unknown SBLGNT book label: ${sourceBook}`);
    const greek = greekRaw
      .replace(/[⸀⸂⸃]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    verseTexts[`${book}.${chapter}.${verse}`] = greek;
  }
}

const header = `// Generated from Faithlife/SBLGNT data/sblgnt/text raw files.
// Source: https://github.com/Faithlife/SBLGNT
// SBLGNT copyright 2010 Society of Biblical Literature and Logos Bible Software; licensed CC BY 4.0.
export const SBLGNT_VERSE_TEXTS = `;

await writeFile("src/sblgnt-texts.js", `${header}${JSON.stringify(verseTexts, null, 2)};\n`);
console.log(`Wrote ${Object.keys(verseTexts).length} SBLGNT verses.`);
