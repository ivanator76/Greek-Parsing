export function nextHorizontalTabKey(currentKey, orderedKeys, { backwards = false } = {}) {
  const currentIndex = orderedKeys.indexOf(currentKey);
  if (currentIndex === -1) return null;
  const nextIndex = backwards ? currentIndex - 1 : currentIndex + 1;
  return orderedKeys[nextIndex] || null;
}
