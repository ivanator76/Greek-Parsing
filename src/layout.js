export function splitWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function createVerse({
  id = cryptoId(),
  reference,
  greek,
  syntax = [],
  morphology = [],
  gloss = [],
  translation = ""
}) {
  const words = splitWords(greek);
  return {
    id,
    reference,
    greek,
    words,
    syntax: normalizeRow(syntax, words.length),
    morphology: normalizeRow(morphology, words.length),
    gloss: normalizeRow(gloss, words.length),
    translation
  };
}

export function wrapVerse(verse, { maxColumns = 8 } = {}) {
  const segments = [];
  for (let start = 0; start < verse.words.length; start += maxColumns) {
    const end = start + maxColumns;
    segments.push({
      start,
      words: verse.words.slice(start, end),
      syntax: verse.syntax.slice(start, end),
      morphology: verse.morphology.slice(start, end),
      gloss: verse.gloss.slice(start, end),
      showTranslation: false,
      translation: ""
    });
  }

  if (segments.length > 0) {
    const finalSegment = segments[segments.length - 1];
    finalSegment.showTranslation = true;
    finalSegment.translation = verse.translation;
  }

  return segments;
}

export function updateVerseGreek(verse, greek) {
  return createVerse({
    ...verse,
    greek,
    syntax: verse.syntax,
    morphology: verse.morphology,
    gloss: verse.gloss
  });
}

export function updateVerseCell(verse, row, index, value) {
  const next = { ...verse, [row]: [...verse[row]] };
  next[row][index] = value;
  return next;
}

function normalizeRow(row, length) {
  return Array.from({ length }, (_, index) => row[index] == null ? "" : row[index]);
}

function cryptoId() {
  const root = typeof globalThis === "undefined" ? window : globalThis;
  if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
  return `verse-${Math.random().toString(36).slice(2)}`;
}
