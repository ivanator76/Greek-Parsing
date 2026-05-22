export const ARCHIVE_APP = "greek-parsing";
export const ARCHIVE_VERSION = 1;

export function createDataArchive(data, exportedAt = new Date().toISOString()) {
  return {
    app: ARCHIVE_APP,
    version: ARCHIVE_VERSION,
    exportedAt,
    data: normalizeArchiveData(data)
  };
}

export function parseDataArchive(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("無法讀取存檔，請確認檔案是有效的 JSON。");
  }

  if (!parsed || parsed.app !== ARCHIVE_APP || parsed.version !== ARCHIVE_VERSION || !parsed.data) {
    throw new Error("這不是 Greek Parsing 存檔，或存檔版本不相容。");
  }

  return normalizeArchiveData(parsed.data);
}

export function mergeImportedData(current, imported) {
  const currentData = normalizeArchiveData(current);
  const importedData = normalizeArchiveData(imported);
  const lessonsById = new Map(currentData.lessons.map((lesson) => [lesson.id, lesson]));
  importedData.lessons.forEach((lesson) => lessonsById.set(lesson.id, lesson));

  return {
    lessons: Array.from(lessonsById.values()),
    practiceDrafts: {
      ...currentData.practiceDrafts,
      ...importedData.practiceDrafts
    },
    standardAnswers: {
      ...currentData.standardAnswers,
      ...importedData.standardAnswers
    }
  };
}

export function importSummary(data) {
  const normalized = normalizeArchiveData(data);
  return `將匯入 ${normalized.lessons.length} 組課程、${Object.keys(normalized.practiceDrafts).length} 份草稿、${Object.keys(normalized.standardAnswers).length} 節標準答案。`;
}

function normalizeArchiveData(data = {}) {
  return {
    lessons: Array.isArray(data.lessons) ? data.lessons.filter(isLessonRecord) : [],
    practiceDrafts: plainObject(data.practiceDrafts),
    standardAnswers: plainObject(data.standardAnswers)
  };
}

function isLessonRecord(lesson) {
  return Boolean(
    lesson
    && typeof lesson.id === "string"
    && typeof lesson.name === "string"
    && Array.isArray(lesson.items)
  );
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
