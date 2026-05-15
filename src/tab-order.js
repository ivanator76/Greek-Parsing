export function nextHorizontalTabKey(currentKey, orderedKeys, { backwards = false } = {}) {
  const currentIndex = orderedKeys.indexOf(currentKey);
  if (currentIndex === -1) return null;
  const nextIndex = backwards ? currentIndex - 1 : currentIndex + 1;
  return orderedKeys[nextIndex] || null;
}

const PARSING_ROWS = ["syntax", "morphology", "gloss"];

export function nextArrowKey(currentKey, direction, { wordCount, fallbackIndex = 0 } = {}) {
  const parsed = parseKey(currentKey);
  if (!parsed || !Number.isFinite(wordCount)) return null;

  if (direction === "ArrowLeft" || direction === "ArrowRight") {
    if (isTranslationRow(parsed.row)) return null;
    const nextIndex = parsed.index + (direction === "ArrowRight" ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= wordCount) return null;
    return makeKey(parsed.verseId, parsed.row, nextIndex);
  }

  if (direction === "ArrowDown") {
    if (isTranslationRow(parsed.row)) return null;
    if (parsed.row === "gloss") return makeKey(parsed.verseId, "translation");
    const rowIndex = PARSING_ROWS.indexOf(parsed.row);
    return rowIndex === -1 ? null : makeKey(parsed.verseId, PARSING_ROWS[rowIndex + 1], parsed.index);
  }

  if (direction === "ArrowUp") {
    if (isTranslationRow(parsed.row)) {
      return makeKey(parsed.verseId, "gloss", clampIndex(fallbackIndex, wordCount));
    }
    const rowIndex = PARSING_ROWS.indexOf(parsed.row);
    return rowIndex <= 0 ? null : makeKey(parsed.verseId, PARSING_ROWS[rowIndex - 1], parsed.index);
  }

  return null;
}

function parseKey(key) {
  const parts = String(key).split(":");
  if (parts.length !== 3 || !parts[0] || !parts[1]) return null;
  return {
    verseId: parts[0],
    row: parts[1],
    index: parts[2] === "" ? null : Number(parts[2])
  };
}

function makeKey(verseId, row, index = "") {
  return `${verseId}:${row}:${index}`;
}

function clampIndex(index, wordCount) {
  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) return 0;
  return Math.max(0, Math.min(numericIndex, wordCount - 1));
}

function isTranslationRow(row) {
  return row === "translation" || row === "lineTranslation";
}
