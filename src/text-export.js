import { wrapVerse } from "./layout.js";
import { GREEK_TEXT_SOURCE } from "./text-source.js";

export function formatWorksheetText({
  verses,
  translationMode = "verse",
  maxColumns = 6,
  standardAnswers = {},
  expandedStandardAnswers = {}
}) {
  const lines = [
    "Koine Greek Parsing",
    GREEK_TEXT_SOURCE,
    ""
  ];

  if (!verses.length) {
    lines.push("尚未加入經文");
    return lines.join("\n");
  }

  verses.forEach((verse, verseIndex) => {
    if (verseIndex > 0) lines.push("");
    lines.push(verse.reference);
    lines.push("");

    wrapVerse(verse, { maxColumns }).forEach((segment, segmentIndex) => {
      if (segmentIndex > 0) lines.push("");
      lines.push(`1 ${joinCells(segment.syntax)}`);
      lines.push(`2 ${joinCells(segment.words)}`);
      lines.push(`3 ${joinCells(segment.morphology)}`);
      lines.push(`4 ${joinCells(segment.gloss)}`);
      if (translationMode === "line") {
        lines.push(`5 本行翻譯 ${segment.lineTranslation || ""}`);
      } else if (segment.showTranslation) {
        lines.push(`5 整句翻譯 ${segment.translation || ""}`);
      }
    });

    const answer = standardAnswers[verse.reference];
    if (answer && expandedStandardAnswers[verse.reference]) {
      lines.push("");
      lines.push("已顯示標準答案");
      lines.push(`語法 ${joinCells(answer.syntax || [])}`);
      lines.push(`形態 ${joinCells(answer.morphology || [])}`);
      lines.push(`逐字 ${joinCells(answer.gloss || [])}`);
      lines.push(`整句 ${answer.translation || ""}`);
    }
  });

  return lines.join("\n");
}

function joinCells(values = []) {
  return values.map((value) => value || "").join(" | ");
}
