# Greek Parsing App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first usable browser app for practicing Koine Greek five-line parsing worksheets with A4 print output.

**Architecture:** A static vanilla JavaScript app keeps verse exercises, syntax tags, and selected word state in browser memory. Pure layout helpers split Greek words into printable segments so tests can verify the wrapping rules independently from the DOM.

**Tech Stack:** HTML, CSS, ES modules, Node.js built-in test runner.

---

### Task 1: Core Layout Model

**Files:**
- Create: `src/layout.js`
- Test: `tests/layout.test.js`

- [x] Write tests for wrapping Greek words into segments where every segment has an upper syntax row and only the final segment has the sentence translation row.
- [x] Implement `splitWords`, `createVerse`, and `wrapVerse`.
- [x] Run `npm test`.

### Task 2: Syntax Tag Store

**Files:**
- Create: `src/tags.js`
- Test: `tests/tags.test.js`

- [x] Write tests for adding, deleting, and ignoring duplicate syntax tags.
- [x] Implement `createTagStore`.
- [x] Run `npm test`.

### Task 3: Browser App

**Files:**
- Create: `index.html`
- Create: `src/app.js`
- Create: `src/styles.css`
- Create: `package.json`

- [x] Build the A4 worksheet interface with multiple verse blocks.
- [x] Add book/chapter/verse selectors, manual Greek editing, and an add verse action.
- [x] Render per-word morphology and gloss inputs aligned to Greek words.
- [x] Render repeated syntax rows per wrapped Greek segment and a single final translation line per verse.
- [x] Add right-panel vocabulary and editable grammar tag tools.

### Task 4: Verification

**Files:**
- Modify as needed based on verification.

- [x] Run `npm test`.
- [x] Run a static server and inspect the app in browser.
- [x] Verify the app loads, worksheet renders, syntax tags can be added/deleted, and print CSS is present.
