import { VERSE_TEXTS } from "./nt-texts.js";

export const DEFAULT_GREEK_TEXT_VERSION_ID = "tischendorf";
export const CUSTOM_GREEK_TEXT_STORAGE_KEY = "greekParsing.customGreekTexts.v1";
export const SELECTED_GREEK_TEXT_STORAGE_KEY = "greekParsing.selectedGreekText.v1";

export const DEFAULT_GREEK_TEXT_VERSION = {
  id: DEFAULT_GREEK_TEXT_VERSION_ID,
  name: "Tischendorf Greek New Testament",
  source: "",
  builtIn: true,
  verses: VERSE_TEXTS
};

export function allGreekTextVersions(customVersions = []) {
  return [DEFAULT_GREEK_TEXT_VERSION, ...customVersions];
}

export function selectedGreekTextVersion({ versions, selectedId }) {
  return versions.find((version) => version.id === selectedId) || DEFAULT_GREEK_TEXT_VERSION;
}

export function greekTextSourceLabel(version = DEFAULT_GREEK_TEXT_VERSION) {
  return `希臘原文：${version.name}${version.source ? ` (${version.source})` : ""}`;
}

export function loadCustomGreekTextVersions(storage = globalThis.localStorage) {
  try {
    const raw = storage && storage.getItem(CUSTOM_GREEK_TEXT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredVersion).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveCustomGreekTextVersions(versions, storage = globalThis.localStorage) {
  if (!storage) return;
  const portable = versions.map(({ id, name, source, verses }) => ({ id, name, source, verses }));
  storage.setItem(CUSTOM_GREEK_TEXT_STORAGE_KEY, JSON.stringify(portable));
}

export function loadSelectedGreekTextVersionId(storage = globalThis.localStorage) {
  try {
    return storage && storage.getItem(SELECTED_GREEK_TEXT_STORAGE_KEY) || DEFAULT_GREEK_TEXT_VERSION_ID;
  } catch {
    return DEFAULT_GREEK_TEXT_VERSION_ID;
  }
}

export function saveSelectedGreekTextVersionId(id, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(SELECTED_GREEK_TEXT_STORAGE_KEY, id || DEFAULT_GREEK_TEXT_VERSION_ID);
}

export function parseImportedGreekTextVersion(text, { id = createVersionId() } = {}) {
  const parsed = JSON.parse(text);
  const name = String(parsed.name || "").trim();
  if (!name) throw new Error("匯入檔需要 name，例如 NA28 或 UBS5。");

  const verses = normalizeVerseMap(parsed.verses);
  if (!Object.keys(verses).length) {
    throw new Error("匯入檔需要 verses，格式例如 { \"John.3.16\": \"Οὕτως...\" }。");
  }

  return {
    id: String(parsed.id || id),
    name,
    source: String(parsed.source || "User-provided Greek text").trim(),
    builtIn: false,
    verses
  };
}

function normalizeStoredVersion(value) {
  if (!value || typeof value !== "object") return null;
  try {
    const verses = normalizeVerseMap(value.verses);
    if (!Object.keys(verses).length) return null;
    const name = String(value.name || "").trim();
    if (!name) return null;
    return {
      id: String(value.id || createVersionId()),
      name,
      source: String(value.source || "User-provided Greek text").trim(),
      builtIn: false,
      verses
    };
  } catch {
    return null;
  }
}

function normalizeVerseMap(verses) {
  if (!verses || typeof verses !== "object" || Array.isArray(verses)) return {};
  return Object.fromEntries(Object.entries(verses)
    .map(([key, value]) => [String(key).trim(), String(value || "").trim()])
    .filter(([key, value]) => /^[1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?\.\d+\.\d+$/.test(key) && value));
}

function createVersionId() {
  return `custom-${Date.now().toString(36)}`;
}
