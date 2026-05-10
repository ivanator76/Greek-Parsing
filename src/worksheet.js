import { createVerse } from "./layout.js";

export function createBlankExercise({ id, reference, greek }) {
  return createVerse({
    id,
    reference,
    greek,
    syntax: [],
    morphology: [],
    gloss: [],
    translation: ""
  });
}
