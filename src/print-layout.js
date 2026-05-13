export function printPageRule(orientation) {
  const normalized = orientation === "portrait" ? "portrait" : "landscape";
  return `@page { size: A4 ${normalized}; margin: 10mm; }`;
}

export function maxPrintColumns(orientation) {
  return orientation === "portrait" ? 4 : 7;
}
