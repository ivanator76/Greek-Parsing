import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function functionBody(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const next = appSource.indexOf("\nfunction ", start + 1);
  return appSource.slice(start, next === -1 ? appSource.length : next);
}

test("top toolbar omits the blank page button and density controls", () => {
  const toolbar = functionBody("renderToolbar");

  assert.doesNotMatch(toolbar, /data-action="new-practice-page"/);
  assert.doesNotMatch(toolbar, /data-action="set-density"/);
});

test("top toolbar offers a save-as menu beside print", () => {
  const toolbar = functionBody("renderToolbar");

  assert.match(toolbar, /<details class="save-menu">/);
  assert.match(toolbar, /<summary>儲存為<\/summary>/);
  assert.match(toolbar, /data-action="save-text"/);
  assert.match(toolbar, /data-action="save-docx"/);
  assert.match(toolbar, />TXT<\/button>/);
  assert.match(toolbar, />DOCX<\/button>/);
  assert.match(toolbar, /class="save-menu"[\s\S]*data-action="print"/);
});

test("page side panel places the density range directly below the page heading", () => {
  const sidePanel = functionBody("renderSidePanel");

  assert.match(sidePanel, /<h2>本頁<\/h2>/);
  assert.match(sidePanel, /<button class="side-panel-toggle" data-action="toggle-side-panel" aria-expanded="true">收起<\/button>/);
  assert.match(sidePanel, /\$\{renderDensityControl\(\)\}/);
  assert.match(appSource, /<input[^>]+type="range"[^>]+data-density-range/s);
  assert.match(appSource, /寬鬆[\s\S]*標準[\s\S]*緊密/);
});

test("page side panel can collapse to a narrow toggle", () => {
  const sidePanel = functionBody("renderSidePanel");

  assert.match(sidePanel, /state\.sidePanelCollapsed/);
  assert.match(sidePanel, /side-panel-collapsed/);
  assert.match(sidePanel, /aria-expanded="false">本頁<\/button>/);
  assert.match(appSource, /data-action="toggle-side-panel"/);
  assert.match(cssSource, /\.is-side-collapsed \.workspace\s*\{[^}]*grid-template-columns:\s*minmax\(720px,\s*1fr\);/s);
  assert.match(cssSource, /\.side-panel-collapsed\s*\{[^}]*position:\s*fixed;/s);
});

test("collapsed side panel enlarges the worksheet for focused editing", () => {
  assert.match(cssSource, /\.is-side-collapsed:not\(\.is-print-mode\)\s*\{[^}]*--greek-font-size:\s*25px;/s);
  assert.match(cssSource, /\.is-side-collapsed:not\(\.is-print-mode\)\s*\{[^}]*--input-height:\s*33px;/s);
  assert.match(cssSource, /\.is-side-collapsed:not\(\.is-print-mode\) \.paper\s*\{[^}]*width:\s*min\(100%,\s*1320px\);/s);
});

test("side panel scrolls independently when its content exceeds the viewport", () => {
  assert.match(cssSource, /\.side-panel\s*\{[^}]*max-height:\s*calc\(100vh - 102px\);/s);
  assert.match(cssSource, /\.side-panel\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(cssSource, /\.side-panel\s*\{[^}]*overscroll-behavior:\s*contain;/s);
});

test("lesson panel exposes import and export controls for saved data", () => {
  const lessonPanel = functionBody("renderLessonPanel");

  assert.match(lessonPanel, /資料備份/);
  assert.match(lessonPanel, /data-action="export-data"/);
  assert.match(lessonPanel, /data-action="import-data"/);
  assert.match(lessonPanel, /data-import-file/);
  assert.match(lessonPanel, /所有課程、草稿、標準答案與匯入文本都只存在本機瀏覽器，不會上傳到伺服器。/);
  assert.match(cssSource, /\.privacy-note\s*\{/);
});

test("lesson picker loads immediately and keeps deletion beside the menu", () => {
  const lessonPanel = functionBody("renderLessonPanel");
  const bindEvents = functionBody("bindEvents");
  const deleteLesson = functionBody("deleteSelectedLesson");

  assert.match(lessonPanel, /class="lesson-picker-row"/);
  assert.match(lessonPanel, /<select data-lesson-picker>[\s\S]*data-action="delete-lesson"/);
  assert.doesNotMatch(lessonPanel, /data-action="load-lesson"/);
  assert.match(lessonPanel, /class="delete-lesson-button"/);
  assert.match(bindEvents, /lessonPicker[\s\S]*loadSelectedLesson\(\);/);
  assert.doesNotMatch(appSource, /if \(action === "load-lesson"\)/);
  assert.match(deleteLesson, /clearPracticePage\(state\)/);
  assert.match(deleteLesson, /renderPreservingSidePanelScroll\(\);/);
  assert.match(cssSource, /\.delete-lesson-button\s*\{[^}]*color:\s*#b42318;/s);
});

test("page panel exposes a Greek text import control for user-owned NA28 or UBS5 text", () => {
  const greekTextPanel = functionBody("renderGreekTextPanel");

  assert.match(greekTextPanel, /希臘文本/);
  assert.match(greekTextPanel, /data-greek-text-version/);
  assert.match(greekTextPanel, /data-action="import-greek-text"/);
  assert.match(greekTextPanel, /匯入 NA28 \/ UBS5/);
  assert.match(greekTextPanel, /data-greek-text-import-file/);
});

test("page panel exposes word color swatches for the selected word", () => {
  const pagePanel = functionBody("renderWordColorPanel");
  const segment = functionBody("renderSegment");

  assert.match(pagePanel, /標注顏色/);
  assert.match(pagePanel, /data-action="set-word-color"/);
  assert.match(appSource, /WORD_COLOR_OPTIONS[\s\S]*id: "yellow"[\s\S]*id: "green"[\s\S]*id: "blue"[\s\S]*id: "red"/);
  assert.match(appSource, /WORD_COLOR_OPTIONS[\s\S]*id: "", label: "無色"/);
  assert.match(pagePanel, /data-word-color="\$\{escapeAttr\(color\.id\)\}"/);
  assert.match(segment, /word-color-\$\{wordColor\}/);
  assert.match(cssSource, /\.color-swatch\.is-yellow/);
  assert.match(cssSource, /\.word-column\.word-color-red/);
});

test("editing Greek text persists changes for the active lesson", () => {
  assert.match(appSource, /function persistActiveLessonGreekText\(\)/);
  assert.match(appSource, /if \(verse\) \{[\s\S]*persistActiveLessonGreekText\(\);[\s\S]*persistActiveDraft\(\);/);
  assert.match(appSource, /createLessonRecord\(\{[\s\S]*id: activeLesson\.id,[\s\S]*name: activeLesson\.name,[\s\S]*verses: state\.verses,[\s\S]*createdAt: activeLesson\.createdAt/);
  assert.doesNotMatch(appSource, /greekByReference/);
});

test("keyboard navigation does not intercept IME composition keys", () => {
  const keydown = functionBody("handleInputKeydown");

  assert.match(keydown, /isImeComposing\(event\)/);
  assert.match(appSource, /function isImeComposing\(event\)/);
  assert.match(appSource, /event\.isComposing/);
  assert.match(appSource, /event\.key === "Process"/);
  assert.match(appSource, /event\.keyCode === 229/);
});

test("side panel controls preserve the side panel scroll position", () => {
  const preserveScroll = functionBody("renderPreservingSidePanelScroll");

  assert.match(preserveScroll, /querySelector\("\.side-panel"\)/);
  assert.match(preserveScroll, /scrollTop/);
  assert.match(appSource, /lessonPicker[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /function loadSelectedLesson\(\)[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /data-tab[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /action === "toggle-study-tools"[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /function lookupSelectedWord\(\)[\s\S]*renderPreservingSidePanelScroll\(\);[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /function insertTag\(tag\)[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /function addTag\(\)[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /function fillLocalMorphology\(morphology\)[\s\S]*renderPreservingSidePanelScroll\(\);/);
  assert.match(appSource, /action === "remove-tag"[\s\S]*renderPreservingSidePanelScroll\(\);/);
});
