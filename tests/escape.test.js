import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml } from "../src/escape.js";

test("escapeHtml protects text inserted into HTML templates", () => {
  assert.equal(escapeHtml('<span title="x">καί & λόγος</span>'), "&lt;span title=&quot;x&quot;&gt;καί &amp; λόγος&lt;/span&gt;");
});
