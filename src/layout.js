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
  translation = "",
  lineBreaks = [],
  lineTranslations = {}
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
    translation,
    lineBreaks: normalizeLineBreaks(lineBreaks, words.length),
    lineTranslations: normalizeLineTranslations(lineTranslations, words.length)
  };
}

export function wrapVerse(verse, { maxColumns = 8 } = {}) {
  if (Array.isArray(verse.lineBreaks) && verse.lineBreaks.length) {
    return wrapVerseAtBreaks(verse);
  }

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
      translation: "",
      lineTranslation: lineTranslationFor(verse, start)
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
    gloss: verse.gloss,
    lineBreaks: [],
    lineTranslations: {}
  });
}

export function updateVerseCell(verse, row, index, value) {
  const next = { ...verse, [row]: [...verse[row]] };
  next[row][index] = value;
  return next;
}

export function updateVerseLineTranslation(verse, start, value) {
  return {
    ...verse,
    lineTranslations: normalizeLineTranslations({
      ...verse.lineTranslations,
      [start]: value
    }, verse.words.length)
  };
}

export function toggleLineBreakAfter(verse, index) {
  const lineBreaks = new Set(verse.lineBreaks || []);
  if (lineBreaks.has(index)) {
    lineBreaks.delete(index);
  } else if (index >= 0 && index < verse.words.length - 1) {
    lineBreaks.add(index);
  }
  return {
    ...verse,
    lineBreaks: normalizeLineBreaks([...lineBreaks], verse.words.length)
  };
}

function wrapVerseAtBreaks(verse) {
  const segments = [];
  let start = 0;
  for (const breakIndex of normalizeLineBreaks(verse.lineBreaks, verse.words.length)) {
    segments.push(createSegment(verse, start, breakIndex + 1));
    start = breakIndex + 1;
  }
  if (start < verse.words.length) {
    segments.push(createSegment(verse, start, verse.words.length));
  }
  markFinalSegment(segments, verse.translation);
  return segments;
}

function createSegment(verse, start, end) {
  return {
    start,
    words: verse.words.slice(start, end),
    syntax: verse.syntax.slice(start, end),
    morphology: verse.morphology.slice(start, end),
    gloss: verse.gloss.slice(start, end),
    showTranslation: false,
    translation: "",
    lineTranslation: lineTranslationFor(verse, start)
  };
}

function markFinalSegment(segments, translation) {
  if (segments.length > 0) {
    const finalSegment = segments[segments.length - 1];
    finalSegment.showTranslation = true;
    finalSegment.translation = translation;
  }
}

function normalizeRow(row, length) {
  return Array.from({ length }, (_, index) => row[index] == null ? "" : row[index]);
}

function normalizeLineBreaks(lineBreaks, length) {
  return [...new Set(lineBreaks
    .map((index) => Number(index))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < length - 1))]
    .sort((left, right) => left - right);
}

function normalizeLineTranslations(lineTranslations, length) {
  return Object.fromEntries(Object.entries(lineTranslations || {})
    .map(([start, value]) => [Number(start), value == null ? "" : String(value)])
    .filter(([start, value]) => Number.isInteger(start) && start >= 0 && start < length && value !== ""));
}

function lineTranslationFor(verse, start) {
  return verse.lineTranslations && verse.lineTranslations[start] ? verse.lineTranslations[start] : "";
}

function cryptoId() {
  const root = typeof globalThis === "undefined" ? window : globalThis;
  if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
  return `verse-${Math.random().toString(36).slice(2)}`;
}
