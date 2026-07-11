import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const BOOK_SHORTS = [
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1 Cor", "2 Cor", "Gal",
  "Eph", "Phil", "Col", "1 Thess", "2 Thess", "1 Tim", "2 Tim", "Titus",
  "Phlm", "Heb", "Jas", "1 Pet", "2 Pet", "1 John", "2 John", "3 John",
  "Jude", "Rev"
];

const SOURCE = "https://github.com/eliranwong/OpenGNT/tree/master/mapping_BGB/compare_OGNT_NA28";

export function parseWordDifferences(tsv) {
  const groups = new Map();
  for (const line of tsv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const [bookNumber, chapter, verse, openGnt, comparison] = line.split("\t");
    const reference = referenceFor(bookNumber, chapter, verse);
    if (!reference) continue;
    const differences = groups.get(reference) || [];
    differences.push({ openGnt, comparison });
    groups.set(reference, differences);
  }
  return [...groups].map(([reference, differences]) => ({ reference, differences }));
}

export function parseWordOrderReferences(tsv) {
  const references = [];
  for (const line of tsv.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split("\t");
    const match = (cells[3] || "").match(/〔(\d+)｜(\d+)｜(\d+)〕/);
    if (!match) continue;
    const reference = referenceFor(match[1], match[2], match[3]);
    if (reference) references.push(reference);
  }
  return references;
}

function referenceFor(bookNumber, chapter, verse) {
  const short = BOOK_SHORTS[Number(bookNumber) - 40];
  return short && chapter && verse ? `${short} ${chapter}:${verse}` : "";
}

export async function writeDifferenceModule({ mainPath, minorPath, orderPath }) {
  const [mainText, minorText, orderText] = await Promise.all([
    readFile(mainPath, "utf8"),
    readFile(minorPath, "utf8"),
    readFile(orderPath, "utf8")
  ]);
  const data = {
    source: SOURCE,
    main: parseWordDifferences(mainText),
    minor: parseWordDifferences(minorText),
    wordOrder: parseWordOrderReferences(orderText)
  };
  const header = `// Generated from OpenGNT's official OGNT/NA28 comparison tables.\n// Source: ${SOURCE}\n`;
  await writeFile("src/opengnt-na28-differences.js", `${header}export const OPENGNT_NA28_DIFFERENCES = ${JSON.stringify(data, null, 2)};\n`);
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mainPath, minorPath, orderPath] = process.argv.slice(2);
  if (!mainPath || !minorPath || !orderPath) {
    throw new Error("Usage: node scripts/generate-opengnt-na28-differences.js diff_main.tsv diff_minor.tsv diff_wordOrder.tsv");
  }
  const data = await writeDifferenceModule({ mainPath, minorPath, orderPath });
  const mainWords = data.main.reduce((sum, item) => sum + item.differences.length, 0);
  const minorWords = data.minor.reduce((sum, item) => sum + item.differences.length, 0);
  console.log(`Wrote ${mainWords} main word differences, ${minorWords} minor differences, and ${data.wordOrder.length} word-order verses.`);
}
