export const NT_BOOKS = [
  { id: "Matthew", short: "Matt", name: "Matthew", chapters: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20] },
  { id: "Mark", short: "Mark", name: "Mark", chapters: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20] },
  { id: "Luke", short: "Luke", name: "Luke", chapters: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53] },
  { id: "John", short: "John", name: "John", chapters: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25] },
  { id: "Acts", short: "Acts", name: "Acts", chapters: [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31] },
  { id: "Romans", short: "Rom", name: "Romans", chapters: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27] },
  { id: "1 Corinthians", short: "1 Cor", name: "1 Corinthians", chapters: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24] },
  { id: "2 Corinthians", short: "2 Cor", name: "2 Corinthians", chapters: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14] },
  { id: "Galatians", short: "Gal", name: "Galatians", chapters: [24, 21, 29, 31, 26, 18] },
  { id: "Ephesians", short: "Eph", name: "Ephesians", chapters: [23, 22, 21, 32, 33, 24] },
  { id: "Philippians", short: "Phil", name: "Philippians", chapters: [30, 30, 21, 23] },
  { id: "Colossians", short: "Col", name: "Colossians", chapters: [29, 23, 25, 18] },
  { id: "1 Thessalonians", short: "1 Thess", name: "1 Thessalonians", chapters: [10, 20, 13, 18, 28] },
  { id: "2 Thessalonians", short: "2 Thess", name: "2 Thessalonians", chapters: [12, 17, 18] },
  { id: "1 Timothy", short: "1 Tim", name: "1 Timothy", chapters: [20, 15, 16, 16, 25, 21] },
  { id: "2 Timothy", short: "2 Tim", name: "2 Timothy", chapters: [18, 26, 17, 22] },
  { id: "Titus", short: "Titus", name: "Titus", chapters: [16, 15, 15] },
  { id: "Philemon", short: "Phlm", name: "Philemon", chapters: [25] },
  { id: "Hebrews", short: "Heb", name: "Hebrews", chapters: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25] },
  { id: "James", short: "Jas", name: "James", chapters: [27, 26, 18, 17, 20] },
  { id: "1 Peter", short: "1 Pet", name: "1 Peter", chapters: [25, 25, 22, 19, 14] },
  { id: "2 Peter", short: "2 Pet", name: "2 Peter", chapters: [21, 22, 18] },
  { id: "1 John", short: "1 John", name: "1 John", chapters: [10, 29, 24, 21, 21] },
  { id: "2 John", short: "2 John", name: "2 John", chapters: [13] },
  { id: "3 John", short: "3 John", name: "3 John", chapters: [15] },
  { id: "Jude", short: "Jude", name: "Jude", chapters: [25] },
  { id: "Revelation", short: "Rev", name: "Revelation", chapters: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21] }
];

import { VERSE_TEXTS } from "./nt-texts.js";

export { VERSE_TEXTS };

export function books() {
  return NT_BOOKS;
}

export function chaptersFor(bookId) {
  return bookById(bookId).chapters.map((_, index) => String(index + 1));
}

export function versesFor(bookId, chapter) {
  const count = bookById(bookId).chapters[Number(chapter) - 1] || 0;
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

export function referenceFor({ book, chapter, verse }) {
  const found = bookById(book);
  return `${found.short} ${chapter}:${verse}`;
}

export function getGreekText({ book, chapter, verse }) {
  return VERSE_TEXTS[`${book}.${chapter}.${verse}`] || "";
}

export function hasGreekText(reference) {
  return getGreekText(reference).length > 0;
}

function bookById(bookId) {
  const found = NT_BOOKS.find((book) => book.id === bookId);
  if (!found) throw new Error(`Unknown book: ${bookId}`);
  return found;
}
