export function printPageRule(orientation) {
  const normalized = orientation === "portrait" ? "portrait" : "landscape";
  return `@page { size: A4 ${normalized}; margin: 10mm; }`;
}

export function maxPrintColumns(orientation, density = "standard") {
  const normalized = normalizeLayoutDensity(density);
  if (orientation === "portrait") {
    if (normalized === "compact") return 5;
    if (normalized === "loose") return 3;
    return 4;
  }
  if (normalized === "compact") return 9;
  if (normalized === "loose") return 6;
  return 7;
}

export function maxEditColumns(density = "standard") {
  const normalized = normalizeLayoutDensity(density);
  if (normalized === "compact") return 8;
  if (normalized === "loose") return 5;
  return 6;
}

export function normalizeLayoutDensity(density) {
  return density === "loose" || density === "compact" ? density : "standard";
}
