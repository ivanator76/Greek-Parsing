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
    }, {})
  };
}

export function applyPracticeDraft(verses, draft) {
  if (!draft) return verses;
  return verses.map((verse) => {
    const answer = draft.answers && draft.answers[verse.reference];
    if (!answer) return verse;
    return {
      ...verse,
      syntax: normalizeRow(answer.syntax, verse.words.length),
      morphology: normalizeRow(answer.morphology, verse.words.length),
      gloss: normalizeRow(answer.gloss, verse.words.length),
      translation: answer.translation == null ? "" : answer.translation
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

function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
