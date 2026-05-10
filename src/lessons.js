import { createBlankExercise } from "./worksheet.js";

export const LESSON_STORAGE_KEY = "greek-parsing-lessons";

export function normalizeLessonName(name) {
  return name.trim().replace(/\s+/g, " ");
}

export function createLessonRecord({ id, name, verses, createdAt = new Date().toISOString() }) {
  return {
    id,
    name: normalizeLessonName(name),
    createdAt,
    items: verses.map((verse) => ({
      reference: verse.reference,
      greek: verse.greek
    }))
  };
}

export function hydrateLesson(lesson, createId) {
  return lesson.items.map((item) => createBlankExercise({
    id: createId(),
    reference: item.reference,
    greek: item.greek
  }));
}

export function clearVerseAnswers(verse) {
  return createBlankExercise({
    id: verse.id,
    reference: verse.reference,
    greek: verse.greek
  });
}

export function clearAllAnswers(verses) {
  return verses.map(clearVerseAnswers);
}

export function clearPracticePage(state) {
  return {
    ...state,
    verses: [],
    selected: { verseId: null, wordIndex: 0 },
    selectedLessonId: "",
    activeLessonId: "",
    lessonName: "",
    expandedStandardAnswers: {}
  };
}

export function loadLessons(storage = getLocalStorage()) {
  try {
    if (!storage) return [];
    const raw = storage.getItem(LESSON_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLessonRecord) : [];
  } catch {
    return [];
  }
}

export function saveLessons(lessons, storage = getLocalStorage()) {
  try {
    if (storage) storage.setItem(LESSON_STORAGE_KEY, JSON.stringify(lessons));
  } catch {
    // If the browser blocks localStorage, keep the app usable for the current session.
  }
}

function isLessonRecord(lesson) {
  return Boolean(
    lesson
    && typeof lesson.id === "string"
    && typeof lesson.name === "string"
    && Array.isArray(lesson.items)
  );
}

function getLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
