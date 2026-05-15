export function focusedVerseId(activeElement) {
  return activeElement && activeElement.dataset ? activeElement.dataset.verseId || "" : "";
}

export function preferredVerseIdForEditing({ activeElement, selectedVerseId }) {
  return focusedVerseId(activeElement) || selectedVerseId || "";
}
