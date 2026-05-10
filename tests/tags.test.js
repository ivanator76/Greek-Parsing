import assert from "node:assert/strict";
import test from "node:test";
import { createTagStore } from "../src/tags.js";

test("default classroom syntax tags keep the requested order", () => {
  const tags = ["S", "V+N", "V+G", "V+D", "V+A", "Prp", "NP+G", "V+IP", "PP~Adj", "PP~Adv"];
  const store = createTagStore(tags);

  assert.deepEqual(store.list(), tags);
});

test("tag store adds trimmed tags and ignores duplicates", () => {
  const store = createTagStore(["S", "V"]);

  assert.deepEqual(store.add(" NP+G "), ["S", "V", "NP+G"]);
  assert.deepEqual(store.add("S"), ["S", "V", "NP+G"]);
});

test("tag store deletes existing tags and keeps state unchanged for missing tags", () => {
  const store = createTagStore(["S", "V", "PP~Adj"]);

  assert.deepEqual(store.remove("V"), ["S", "PP~Adj"]);
  assert.deepEqual(store.remove("missing"), ["S", "PP~Adj"]);
});
