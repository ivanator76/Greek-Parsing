export const STANDARD_ANSWER_STORAGE_KEY = "greek-parsing-standard-answers";

export function createStandardAnswer(verse, savedAt = new Date().toISOString()) {
  return {
    reference: verse.reference,
    savedAt,
    syntax: [...verse.syntax],
    morphology: [...verse.morphology],
    gloss: [...verse.gloss],
    translation: verse.translation
  };
}

export function saveStandardAnswer(answers, verse) {
  const answer = createStandardAnswer(verse);
  return {
    ...answers,
    [answer.reference]: answer
  };
}

export function hasStandardAnswer(answers, reference) {
  return Boolean(answers[reference]);
}

export function loadStandardAnswers(storage = getLocalStorage()) {
  try {
    if (!storage) return {};
    const raw = storage.getItem(STANDARD_ANSWER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStandardAnswers(answers, storage = getLocalStorage()) {
  try {
    if (storage) storage.setItem(STANDARD_ANSWER_STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // If the browser blocks localStorage, keep the app usable for the current session.
  }
}

function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
