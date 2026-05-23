export const PRACTICE_DRAFT_STORAGE_KEY = "greek-parsing-practice-drafts";

export function createPracticeDraft(lessonId, verses, updatedAt = new Date().toISOString()) {
  return {
    lessonId,
    updatedAt,
    answers: verses.reduce((answers, verse) => {
      answers[verse.reference] = {
        syntax: [...verse.syntax],
        morphology: [...verse.morphology],
        gloss: [...verse.gloss],
        translation: verse.translation
      };
      return answers;
    }, {}),
    layout: verses.reduce((layout, verse) => {
      layout[verse.reference] = {
        greek: verse.greek,
        lineBreaks: Array.isArray(verse.lineBreaks) ? [...verse.lineBreaks] : [],
        lineTranslations: { ...(verse.lineTranslations || {}) },
        wordColors: normalizeWordColors(verse.wordColors || {}, verse.words.length)
      };
      return layout;
    }, {})
  };
}

export function applyPracticeDraft(verses, draft) {
  if (!draft) return verses;
  return verses.map((verse) => {
    const answer = draft.answers && draft.answers[verse.reference];
    const layout = draft.layout && draft.layout[verse.reference];
    if (!answer && !layout) return verse;
    const greek = layout && layout.greek ? String(layout.greek) : verse.greek;
    const words = layout && layout.greek ? splitWords(greek) : verse.words;
    return {
      ...verse,
      greek,
      words,
      syntax: answer ? normalizeRow(answer.syntax, words.length) : normalizeRow(verse.syntax, words.length),
      morphology: answer ? normalizeRow(answer.morphology, words.length) : normalizeRow(verse.morphology, words.length),
      gloss: answer ? normalizeRow(answer.gloss, words.length) : normalizeRow(verse.gloss, words.length),
      translation: answer && answer.translation != null ? answer.translation : verse.translation,
      lineBreaks: layout ? normalizeLineBreaks(layout.lineBreaks, words.length) : verse.lineBreaks,
      lineTranslations: layout ? normalizeLineTranslations(layout.lineTranslations, words.length) : verse.lineTranslations,
      wordColors: layout ? normalizeWordColors(layout.wordColors, words.length) : normalizeWordColors(verse.wordColors, words.length)
    };
  });
}

export function savePracticeDraft(drafts, lessonId, verses) {
  if (!lessonId) return drafts;
  return {
    ...drafts,
    [lessonId]: createPracticeDraft(lessonId, verses)
  };
}

export function clearPracticeDraft(drafts, lessonId) {
  const next = { ...drafts };
  delete next[lessonId];
  return next;
}

export function loadPracticeDrafts(storage = getLocalStorage()) {
  try {
    if (!storage) return {};
    const raw = storage.getItem(PRACTICE_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function savePracticeDrafts(drafts, storage = getLocalStorage()) {
  try {
    if (storage) storage.setItem(PRACTICE_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // If the browser blocks localStorage, keep the app usable for the current session.
  }
}

function normalizeRow(row = [], length) {
  return Array.from({ length }, (_, index) => row[index] == null ? "" : row[index]);
}

function splitWords(greek) {
  return greek.trim().split(/\s+/).filter(Boolean);
}

function normalizeLineBreaks(lineBreaks = [], length) {
  return [...new Set(lineBreaks
    .map((index) => Number(index))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < length - 1))]
    .sort((left, right) => left - right);
}

function normalizeLineTranslations(lineTranslations = {}, length) {
  return Object.fromEntries(Object.entries(lineTranslations || {})
    .map(([start, value]) => [Number(start), value == null ? "" : String(value)])
    .filter(([start, value]) => Number.isInteger(start) && start >= 0 && start < length && value !== ""));
}

function normalizeWordColors(wordColors = {}, length) {
  return Object.fromEntries(Object.entries(wordColors || {})
    .map(([index, value]) => [Number(index), value == null ? "" : String(value)])
    .filter(([index, value]) => Number.isInteger(index) && index >= 0 && index < length && isAllowedWordColor(value)));
}

function isAllowedWordColor(color) {
  return color === "yellow" || color === "green" || color === "blue" || color === "red";
}

function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
