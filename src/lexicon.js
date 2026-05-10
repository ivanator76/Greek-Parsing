let cachedEntries = null;

export async function lookupWord({ reference, wordIndex, word }) {
  const entries = await loadLexiconEntries();
  return lookupWordInEntries(entries, { reference, wordIndex, word });
}

export function lookupWordInEntries(entries, { reference, wordIndex, word }) {
  const entry = entries[`${reference}.${wordIndex}`];
  if (!entry) {
    return {
      source: "none",
      word,
      lemma: "",
      morphology: "",
      strong: "",
      normalized: ""
    };
  }

  return {
    source: "local",
    word: entry.form,
    lemma: entry.lemma,
    morphology: formatMorphology(entry.morphology),
    rawMorphology: entry.morphology,
    strong: entry.strong,
    normalized: entry.normalized
  };
}

export function formatMorphology(morphology) {
  if (!morphology) return "";
  const parts = morphology.split("-");
  const partOfSpeech = parts[0];

  if (partOfSpeech === "V" && parts[1]) {
    return formatVerbMorphology(parts);
  }

  if (isNominalMorphology(partOfSpeech, parts[1])) {
    return formatNominalMorphology(partOfSpeech, parts);
  }

  return morphology.replace(/-/g, "");
}

function formatVerbMorphology(parts) {
  const verbalCode = parts[1];
  const tense = verbalCode.slice(0, -2);
  const voice = verbalCode.slice(-2, -1);
  const mood = verbalCode.slice(-1);
  const suffix = parts[2] || "";

  if (!tense || !voice || !mood) {
    return parts.join("");
  }

  if (mood === "P" && suffix.length >= 3) {
    return `V${mood}${tense}${voice}${formatCaseGenderNumber(suffix)}`;
  }

  return `V${mood}${tense}${voice}${suffix}`;
}

function formatNominalMorphology(partOfSpeech, parts) {
  const nominalCode = parts[1];
  const suffix = parts.slice(2).join("");
  return `${formatPartOfSpeech(partOfSpeech)}${formatCaseGenderNumber(nominalCode)}${suffix}`;
}

function formatCaseGenderNumber(code) {
  if (code.length < 3) return code;
  const [grammaticalCase, number, gender] = code;
  return `${grammaticalCase}${gender}${number}${code.slice(3)}`;
}

function isNominalMorphology(partOfSpeech, code) {
  return Boolean(code) && ["N", "T", "A"].includes(partOfSpeech) && code.length >= 3;
}

function formatPartOfSpeech(partOfSpeech) {
  return partOfSpeech === "T" ? "D" : partOfSpeech;
}

async function loadLexiconEntries() {
  if (!cachedEntries) {
    const module = await import("./lexicon-data.js");
    cachedEntries = module.LEXICON_ENTRIES;
  }
  return cachedEntries;
}

export function makeExternalLookupUrl(word) {
  return `https://logeion.uchicago.edu/${encodeURIComponent(word)}`;
}
