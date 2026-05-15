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
        lineBreaks: Array.isArray(verse.lineBreaks) ? [...verse.lineBreaks] : [],
        lineTranslations: { ...(verse.lineTranslations || {}) }
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
    return {
      ...verse,
      syntax: answer ? normalizeRow(answer.syntax, verse.words.length) : verse.syntax,
      morphology: answer ? normalizeRow(answer.morphology, verse.words.length) : verse.morphology,
      gloss: answer ? normalizeRow(answer.gloss, verse.words.length) : verse.gloss,
      translation: answer && answer.translation != null ? answer.translation : verse.translation,
      lineBreaks: layout ? normalizeLineBreaks(layout.lineBreaks, verse.words.length) : verse.lineBreaks,
      lineTranslations: layout ? normalizeLineTranslations(layout.lineTranslations, verse.words.length) : verse.lineTranslations
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

function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
