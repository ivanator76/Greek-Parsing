import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const BOOKS = [
  ["Matthew", "Matt"], ["Mark", "Mark"], ["Luke", "Luke"], ["John", "John"],
  ["Acts", "Acts"], ["Romans", "Rom"], ["1 Corinthians", "1 Cor"],
  ["2 Corinthians", "2 Cor"], ["Galatians", "Gal"], ["Ephesians", "Eph"],
  ["Philippians", "Phil"], ["Colossians", "Col"], ["1 Thessalonians", "1 Thess"],
  ["2 Thessalonians", "2 Thess"], ["1 Timothy", "1 Tim"], ["2 Timothy", "2 Tim"],
  ["Titus", "Titus"], ["Philemon", "Phlm"], ["Hebrews", "Heb"], ["James", "Jas"],
  ["1 Peter", "1 Pet"], ["2 Peter", "2 Pet"], ["1 John", "1 John"],
  ["2 John", "2 John"], ["3 John", "3 John"], ["Jude", "Jude"],
  ["Revelation", "Rev"]
];

const LICENSE = "Open Greek New Testament Project by Eliran Wong, CC BY-SA 4.0";
const SOURCE = "https://github.com/eliranwong/OpenGNT";

export function generateOpenGntData(csvText) {
  const verseTokens = new Map();
  const lexiconEntries = {};
  const lines = csvText.split(/\r?\n/);

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    if (columns.length < 12) continue;

    const [bookNumber, chapter, verse] = parseCell(columns[6]);
    const book = BOOKS[Number(bookNumber) - 40];
    if (!book || !chapter || !verse) continue;

    const [, unaccented, accented, lemma, morphology, strongRaw] = parseCell(columns[7]);
    const [prefixRaw = "", suffixRaw = ""] = parseCell(columns[11]);
    if (!accented) continue;

    const verseId = `${book[0]}.${chapter}.${verse}`;
    const reference = `${book[1]} ${chapter}:${verse}`;
    const tokens = verseTokens.get(verseId) || [];
    const prefix = cleanPunctuation(prefixRaw);
    const suffix = cleanPunctuation(suffixRaw);
    const form = `${prefix}${accented}${suffix}`.replace(/\s+/g, "");
    const wordIndex = tokens.length;
    tokens.push(form);
    verseTokens.set(verseId, tokens);

    lexiconEntries[`${reference}.${wordIndex}`] = {
      form,
      normalized: unaccented || accented,
      lemma: lemma || "",
      morphology: morphology || "",
      strong: String(strongRaw || "").replace(/^G/i, "")
    };
  }

  return {
    verses: Object.fromEntries([...verseTokens].map(([key, tokens]) => [key, tokens.join(" ")])),
    lexiconEntries
  };
}

function parseCell(value) {
  const text = String(value || "").trim();
  const inner = text.startsWith("〔") && text.endsWith("〕") ? text.slice(1, -1) : text;
  return inner.split("｜");
}

function cleanPunctuation(value) {
  return String(value || "")
    .replace(/<\/?pm>/g, "")
    .replace(/[¶¬]/g, "")
    .trim();
}

export async function writeOpenGntModules(csvPath) {
  const csvText = await readFile(csvPath, "utf8");
  const { verses, lexiconEntries } = generateOpenGntData(csvText);
  const attribution = `// Generated from OpenGNT BASE_TEXT.\n// Source: ${SOURCE}\n// License: ${LICENSE}.\n`;

  await Promise.all([
    writeFile("src/opengnt-texts.js", `${attribution}export const OPENGNT_VERSE_TEXTS = ${JSON.stringify(verses, null, 2)};\n`),
    writeFile("src/lexicon-data.js", `${attribution}export const LEXICON_ENTRIES = ${JSON.stringify(lexiconEntries, null, 2)};\n`)
  ]);

  return { verseCount: Object.keys(verses).length, wordCount: Object.keys(lexiconEntries).length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error("Usage: node scripts/generate-opengnt.js /path/to/OpenGNT_version3_3.csv");
  }
  const result = await writeOpenGntModules(csvPath);
  console.log(`Wrote ${result.verseCount} OpenGNT verses and ${result.wordCount} aligned lexicon entries.`);
}
