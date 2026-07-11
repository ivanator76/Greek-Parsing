import {
  toggleLineBreakAfter,
  updateVerseCell,
  updateVerseGreek,
  updateVerseLineTranslation,
  updateVerseWordColor,
  wrapVerse
} from "./layout.js";
import {
  createDataArchive,
  importSummary,
  mergeImportedData,
  parseDataArchive
} from "./archive.js";
import { escapeHtml } from "./escape.js";
import { preferredVerseIdForEditing } from "./focused-verse.js";
import {
  DEFAULT_GREEK_TEXT_VERSION,
  greekTextSourceLabel
} from "./greek-text-versions.js";
import {
  clearAllAnswers,
  clearPracticePage,
  clearVerseAnswers,
  createLessonRecord,
  hydrateLesson,
  loadLessons,
  normalizeLessonName,
  saveLessons
} from "./lessons.js";
import { lookupWord, makeExternalLookupUrl } from "./lexicon.js";
import { books, chaptersFor, getGreekText, referenceFor, versesFor } from "./nt.js";
import { OPENGNT_NA28_DIFFERENCES } from "./opengnt-na28-differences.js";
import {
  applyPracticeDraft,
  clearPracticeDraft,
  loadPracticeDrafts,
  savePracticeDraft,
  savePracticeDrafts
} from "./practice-drafts.js";
import { maxEditColumns, maxPrintColumns, normalizeLayoutDensity, printPageRule } from "./print-layout.js";
import { createInitialState } from "./state.js";
import {
  hasStandardAnswer,
  loadStandardAnswers,
  saveStandardAnswer,
  saveStandardAnswers
} from "./standard-answers.js";
import { createTagStore } from "./tags.js";
import { nextArrowKey, nextHorizontalTabKey, shouldMoveBetweenInputsByArrowKey } from "./tab-order.js";
import { createWorksheetDocxBlob } from "./docx-export.js";
import { formatWorksheetText } from "./text-export.js";
import { createBlankExercise } from "./worksheet.js";

const BOOKS = books();
const DEFAULT_TAGS = ["S", "V+N", "V+G", "V+D", "V+A", "Prp", "NP+G", "V+IP", "PP~Adj", "PP~Adv"];
const DENSITY_OPTIONS = ["loose", "standard", "compact"];
const DENSITY_LABELS = {
  loose: "寬鬆",
  standard: "標準",
  compact: "緊密"
};
const WORD_COLOR_OPTIONS = [
  { id: "", label: "無色" },
  { id: "yellow", label: "黃色" },
  { id: "green", label: "綠色" },
  { id: "blue", label: "藍色" },
  { id: "red", label: "紅色" }
];
const tagStore = createTagStore(DEFAULT_TAGS);
const state = createInitialState();
state.lexiconLookup = { key: "", status: "idle", result: null };
state.lessons = loadLessons();
state.standardAnswers = loadStandardAnswers();
state.practiceDrafts = loadPracticeDrafts();
state.lastKeyboardWordIndex = 0;

const app = document.querySelector("#app");

start();

function start() {
  if (globalThis.__greekParsingAppStarted) return;
  globalThis.__greekParsingAppStarted = true;
  try {
    render();
    document.documentElement.setAttribute("data-app-ready", "true");
  } catch (error) {
    globalThis.__greekParsingAppStarted = false;
    showStartupError(error);
    throw error;
  }
}

function showStartupError(error) {
  app.innerHTML = `
    <div class="empty-page">
      <h2>App 載入失敗</h2>
      <p>${escapeHtml(error && error.message ? error.message : String(error))}</p>
    </div>
  `;
}

function render() {
  applyPrintOrientation();
  const sourceLabel = activeGreekTextSourceLabel();
  app.innerHTML = `
    <div class="shell ${state.printMode ? "is-print-mode" : ""} ${state.reflowMode ? "is-reflow-mode" : ""} ${state.projectionMode ? "is-projection-mode" : ""} ${state.sidePanelCollapsed ? "is-side-collapsed" : ""} is-${state.pageOrientation} density-${state.layoutDensity}">
      ${renderToolbar()}
      <main class="workspace">
        <section class="page-wrap">
          <div class="paper" aria-label="A4 parsing worksheet">
            <header class="paper-header">
              <div>
                <p class="eyebrow">Koine Greek Parsing</p>
                <h1>五行分析練習</h1>
                <p class="text-source">${escapeHtml(sourceLabel)}</p>
              </div>
              <span>A4</span>
            </header>
            <div class="worksheet">
              ${state.verses.length ? state.verses.map(renderVerse).join("") : renderEmptyPage()}
            </div>
          </div>
        </section>
        ${renderSidePanel()}
      </main>
      ${renderGreekEditor()}
    </div>
  `;
  bindEvents();
  const greekEditor = app.querySelector("[data-greek-editor]");
  if (greekEditor) greekEditor.focus();
}

function renderPreservingSidePanelScroll() {
  const sidePanel = app.querySelector(".side-panel");
  const scrollTop = sidePanel ? sidePanel.scrollTop : 0;
  render();
  const nextSidePanel = app.querySelector(".side-panel");
  if (nextSidePanel) nextSidePanel.scrollTop = scrollTop;
}

function renderToolbar() {
  const chapters = choicesFor("chapter");
  const verses = choicesFor("verse");
  return `
    <header class="toolbar">
      <div class="brand">Greek Parsing</div>
      <label>書卷 ${renderSelect("book", BOOKS.map((book) => book.id), state.picker.book)}</label>
      <label>章 ${renderSelect("chapter", chapters, state.picker.chapter)}</label>
      <label>節 ${renderSelect("verse", verses, state.picker.verse)}</label>
      <button data-action="add-verse" class="primary">＋ 新增經文</button>
      <button data-action="edit-greek">✎ 編輯希臘文</button>
      <div class="segmented" role="group" aria-label="view mode">
        <button data-action="set-edit" class="${state.printMode ? "" : "active"}">編輯</button>
        <button data-action="set-print" class="${state.printMode ? "active" : ""}">A4列印</button>
      </div>
      <div class="segmented" role="group" aria-label="page orientation">
        <button data-action="set-landscape" class="${state.pageOrientation === "landscape" ? "active" : ""}">橫式</button>
        <button data-action="set-portrait" class="${state.pageOrientation === "portrait" ? "active" : ""}">直式</button>
      </div>
      <div class="segmented" role="group" aria-label="translation mode">
        <button data-action="set-translation-mode" data-translation-mode="verse" class="${state.translationMode === "verse" ? "active" : ""}">整節翻譯</button>
        <button data-action="set-translation-mode" data-translation-mode="line" class="${state.translationMode === "line" ? "active" : ""}">逐行翻譯</button>
      </div>
      <button data-action="toggle-reflow" class="${state.reflowMode ? "active" : ""}">${state.reflowMode ? "結束重排" : "重排模式"}</button>
      <details class="save-menu">
        <summary>儲存為</summary>
        <div class="save-menu-options">
          <button data-action="save-text">TXT</button>
          <button data-action="save-docx">DOCX</button>
        </div>
      </details>
      <button data-action="print">⎙ 列印</button>
    </header>
  `;
}

function renderSelect(name, options, value) {
  return `
    <select data-picker="${name}">
      ${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
    </select>
  `;
}

function renderEmptyPage() {
  return `
    <div class="empty-page">
      <h2>尚未加入經文</h2>
      <p>請在上方選擇新約書卷、章、節，按「新增經文」後，頁面只會載入希臘原文；語法、解析、逐字中文與整句翻譯都會保持空白。</p>
    </div>
  `;
}

function renderGreekEditor() {
  if (!state.greekEditor) return "";
  const verse = state.verses.find((item) => item.id === state.greekEditor.verseId);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="greek-editor-modal" role="dialog" aria-modal="true" aria-labelledby="greek-editor-title">
        <div class="section-title">
          <h2 id="greek-editor-title">編輯希臘文${verse ? ` · ${escapeHtml(verse.reference)}` : ""}</h2>
          <button data-action="cancel-greek-edit" aria-label="關閉希臘文編輯器">×</button>
        </div>
        <textarea data-greek-editor rows="7" spellcheck="false">${escapeHtml(state.greekEditor.greek)}</textarea>
        <p class="panel-note compact">字數不變時會保留手動斷行、逐行翻譯與單字顏色。</p>
        <div class="modal-actions">
          <button data-action="cancel-greek-edit">取消</button>
          <button class="primary" data-action="save-greek-edit">好</button>
        </div>
      </section>
    </div>
  `;
}

function renderVerse(verse) {
  const segments = wrapVerse(verse, {
    maxColumns: state.printMode
      ? maxPrintColumns(state.pageOrientation, state.layoutDensity)
      : maxEditColumns(state.layoutDensity)
  });
  const standardAnswer = state.standardAnswers[verse.reference];
  const hasAnswer = hasStandardAnswer(state.standardAnswers, verse.reference);
  const isExpanded = Boolean(state.expandedStandardAnswers[verse.reference]);
  return `
    <article class="verse-block" data-verse-id="${verse.id}">
      <div class="verse-title">
        <div class="verse-heading">
          <h2>${escapeHtml(verse.reference)}</h2>
          ${hasAnswer ? `
            <button class="answer-status" data-action="toggle-standard-answer" data-reference="${escapeAttr(verse.reference)}">
              ${isExpanded ? "隱藏答案" : "已存答案"}
            </button>
          ` : ""}
        </div>
        <div class="verse-actions">
          <button data-action="save-standard-answer" data-verse-id="${verse.id}">設為標準答案</button>
          <button data-action="clear-verse" data-verse-id="${verse.id}">清空答案</button>
          <button data-action="remove-verse" data-verse-id="${verse.id}" aria-label="remove verse">×</button>
        </div>
      </div>
      ${segments.map((segment) => renderSegment(verse, segment)).join("")}
      ${hasAnswer && isExpanded ? renderStandardAnswer(verse, standardAnswer) : ""}
    </article>
  `;
}

function renderStandardAnswer(verse, answer) {
  const syntax = Array.isArray(answer.syntax) ? answer.syntax : [];
  const morphology = Array.isArray(answer.morphology) ? answer.morphology : [];
  const gloss = Array.isArray(answer.gloss) ? answer.gloss : [];
  return `
    <section class="standard-answer" aria-label="${escapeAttr(verse.reference)} standard answer">
      <div class="answer-row">
        <span>語法</span>
        <p>${renderCompactAnswerItems(verse.words, syntax)}</p>
      </div>
      <div class="answer-row">
        <span>形態</span>
        <p>${renderCompactAnswerItems(verse.words, morphology)}</p>
      </div>
      <div class="answer-row">
        <span>逐字</span>
        <p>${renderCompactAnswerItems(verse.words, gloss)}</p>
      </div>
      <div class="answer-row translation-answer">
        <span>整句</span>
        <p>${escapeHtml(answer.translation || "未填")}</p>
      </div>
    </section>
  `;
}

function renderCompactAnswerItems(words, values) {
  return words.map((word, index) => `
    <span class="answer-item">
      <b>${escapeHtml(word)}</b>
      <em>${escapeHtml(values[index] || "未填")}</em>
    </span>
  `).join("");
}

function renderSegment(verse, segment) {
  const translationRow = state.translationMode === "line" ? "lineTranslation" : "translation";
  const translationKey = state.translationMode === "line"
    ? tabKey(verse.id, "lineTranslation", segment.start)
    : tabKey(verse.id, "translation");
  const columns = segment.words.map((word, offset) => {
    const index = segment.start + offset;
    const selected = state.selected.verseId === verse.id && state.selected.wordIndex === index;
    const hasManualBreak = (verse.lineBreaks || []).includes(index);
    const wordColor = segment.wordColors ? segment.wordColors[offset] || "" : "";
    return `
      <div class="word-column ${selected ? "selected" : ""} ${wordColor ? `word-color-${wordColor}` : ""}" style="--chars:${columnSize(word, verse, index)}" data-word-index="${index}" data-verse-id="${verse.id}">
        <input class="syntax-input" value="${escapeAttr(segment.syntax[offset])}" data-row="syntax" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "syntax", index))}" aria-label="syntax for ${escapeAttr(word)}">
        <button class="greek-word" data-action="select-word" data-index="${index}" data-verse-id="${verse.id}">${escapeHtml(word)}</button>
        <input value="${escapeAttr(segment.morphology[offset])}" data-row="morphology" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "morphology", index))}" aria-label="morphology for ${escapeAttr(word)}">
        <input value="${escapeAttr(segment.gloss[offset])}" data-row="gloss" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "gloss", index))}" aria-label="gloss for ${escapeAttr(word)}">
      </div>
      ${index < verse.words.length - 1 ? `
        <button class="line-break-toggle ${hasManualBreak ? "active" : ""}" data-action="toggle-line-break" data-index="${index}" data-verse-id="${verse.id}" aria-label="toggle line break after ${escapeAttr(word)}">↵</button>
      ` : ""}
    `;
  }).join("");

  return `
    <section class="segment">
      <div class="segment-body">
        <div class="row-label-column">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
        <div class="word-grid">${columns}</div>
      </div>
      ${state.translationMode === "line" || segment.showTranslation ? `
        <label class="translation-line">
          <b>5</b>
          <input value="${escapeAttr(state.translationMode === "line" ? segment.lineTranslation : segment.translation)}" data-row="${translationRow}" data-line-start="${segment.start}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(translationKey)}">
        </label>
      ` : ""}
    </section>
  `;
}

function renderSidePanel() {
  if (state.sidePanelCollapsed) {
    return `
      <aside class="side-panel side-panel-collapsed">
        <button class="side-panel-toggle collapsed" data-action="toggle-side-panel" aria-expanded="false">本頁</button>
      </aside>
    `;
  }

  return `
    <aside class="side-panel">
      <div class="side-panel-header">
        <h2>本頁</h2>
        <button class="side-panel-toggle" data-action="toggle-side-panel" aria-expanded="true">收起</button>
      </div>
      ${renderDensityControl()}
      <button class="wide-button projection-button ${state.projectionMode ? "active" : ""}" data-action="toggle-projection">${state.projectionMode ? "結束投影" : "投影模式"}</button>
      <button class="wide-button primary" data-action="new-practice-page">空白頁</button>
      ${renderPagePanel()}
      <button class="reveal-tools" data-action="toggle-study-tools">${state.showStudyTools ? "隱藏詞彙 / 語法工具" : "顯示詞彙 / 語法工具"}</button>
      ${state.showStudyTools ? renderStudyTools() : ""}
    </aside>
  `;
}

function renderDensityControl() {
  return `
    <label class="density-control">
      <span class="density-control-heading">
        <span>版面密度</span>
        <strong>${DENSITY_LABELS[state.layoutDensity]}</strong>
      </span>
      <input type="range" min="0" max="2" step="1" value="${densitySliderValue(state.layoutDensity)}" data-density-range aria-label="版面密度，左邊寬鬆，中間標準，右邊緊密">
      <span class="density-scale">
        <span>寬鬆</span>
        <span>標準</span>
        <span>緊密</span>
      </span>
    </label>
  `;
}

function renderPagePanel() {
  const greekTextPanel = renderGreekTextPanel();
  if (!state.verses.length) {
    return `
      <p class="panel-note">本頁還沒有經文。新增經文後，這裡會列出本頁題目。</p>
      ${greekTextPanel}
      ${renderLessonPanel()}
    `;
  }

  return `
    ${renderWordColorPanel()}
    <ol class="page-list">
      ${state.verses.map((verse, index) => `
        <li>
          <span>${index + 1}. ${escapeHtml(verse.reference)}</span>
          <small>${verse.words.length} words</small>
        </li>
      `).join("")}
    </ol>
    <button class="wide-button" data-action="clear-page">清空本頁答案</button>
    ${greekTextPanel}
    ${renderLessonPanel()}
  `;
}

function renderWordColorPanel() {
  const selectedVerse = state.verses.find((verse) => verse.id === state.selected.verseId);
  const selectedWord = selectedVerse && selectedVerse.words[state.selected.wordIndex];
  if (!selectedVerse || selectedWord == null) {
    return `
      <section class="tool-section word-color-panel">
        <div class="section-title">
          <p class="label">標注顏色</p>
          <small>先選取一個希臘字</small>
        </div>
      </section>
    `;
  }
  const activeColor = selectedVerse.wordColors ? selectedVerse.wordColors[state.selected.wordIndex] || "" : "";
  return `
    <section class="tool-section word-color-panel">
      <div class="section-title">
        <p class="label">標注顏色</p>
        <small>${escapeHtml(selectedWord)}</small>
      </div>
      <div class="color-swatch-row" role="group" aria-label="標注顏色">
        ${WORD_COLOR_OPTIONS.map((color) => `
          <button
            class="color-swatch is-${color.id || "none"} ${activeColor === color.id ? "active" : ""}"
            data-action="set-word-color"
            data-word-color="${escapeAttr(color.id)}"
            aria-label="${color.label}"
            title="${color.label}"
          ></button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderGreekTextPanel() {
  const active = activeGreekTextVersion();
  return `
    <section class="tool-section greek-text-panel">
      <div class="section-title">
        <p class="label">希臘文本</p>
        <small>${escapeHtml(active.name)}</small>
      </div>
      <p class="panel-note compact">本 app 固定使用 OpenGNT；文本與本地詞彙解析來自同一份逐字資料。</p>
      ${renderGreekTextDifferences()}
    </section>
  `;
}

function renderGreekTextDifferences() {
  const data = OPENGNT_NA28_DIFFERENCES;
  const mainCount = data.main.reduce((sum, item) => sum + item.differences.length, 0);
  const minorCount = data.minor.reduce((sum, item) => sum + item.differences.length, 0);
  return `
    <details class="text-differences">
      <summary>查看與 NA28 的差異經節</summary>
      <div class="text-differences-content">
        <p>依 OpenGNT 官方比較表整理；比較詞以 TANTT 對應詞代表 NA28 讀法，不含 NA28 批判 apparatus。</p>
        <details open>
          <summary>主要用字：${mainCount} 字，${data.main.length} 節</summary>
          <ol class="difference-reading-list">
            ${data.main.map((item) => `
              <li>
                <strong>${escapeHtml(item.reference)}</strong>
                <span>${item.differences.map((difference) => `${escapeHtml(difference.openGnt)} → ${escapeHtml(difference.comparison)}`).join("；")}</span>
              </li>
            `).join("")}
          </ol>
        </details>
        <details>
          <summary>語序差異：${data.wordOrder.length} 節</summary>
          <p class="difference-references">${data.wordOrder.map(escapeHtml).join("、")}</p>
        </details>
        <details>
          <summary>次要拼字：${minorCount} 處，${data.minor.length} 節</summary>
          <p class="difference-references">${data.minor.map((item) => escapeHtml(item.reference)).join("、")}</p>
        </details>
        <a href="${escapeAttr(data.source)}" target="_blank" rel="noreferrer">查看 OpenGNT 官方比較資料</a>
      </div>
    </details>
  `;
}

function renderLessonPanel() {
  return `
    <section class="tool-section lesson-panel">
      <div class="section-title">
        <p class="label">課程組</p>
        <small>${state.lessons.length} 組${state.activeLessonId ? " · 草稿自動儲存" : ""}</small>
      </div>
      <label class="stacked-label">
        課程名稱
        <input data-lesson-name value="${escapeAttr(state.lessonName)}" placeholder="例如：第 1 課">
      </label>
      <button class="wide-button primary" data-action="save-lesson" ${state.verses.length ? "" : "disabled"}>儲存目前經文為課程</button>
      <button class="wide-button" data-action="new-practice-page" ${state.verses.length || state.selectedLessonId || state.activeLessonId ? "" : "disabled"}>離開課程 / 新增空白頁</button>
      <div class="stacked-label">
        <span>已儲存課程</span>
        <div class="lesson-picker-row">
          <select data-lesson-picker>
            <option value="">選擇課程</option>
            ${state.lessons.map((lesson) => `
              <option value="${escapeAttr(lesson.id)}" ${lesson.id === state.selectedLessonId ? "selected" : ""}>
                ${escapeHtml(lesson.name)}
              </option>
            `).join("")}
          </select>
          <button class="delete-lesson-button" data-action="delete-lesson" aria-label="刪除選取課程" title="刪除選取課程" ${state.selectedLessonId ? "" : "disabled"}>×</button>
        </div>
      </div>
      <section class="tool-section backup-panel">
        <div class="section-title">
          <p class="label">資料備份</p>
        </div>
        <p class="privacy-note">所有課程、草稿與標準答案都只存在本機瀏覽器，不會上傳到伺服器。</p>
        <div class="button-row wrap">
          <button data-action="export-data">匯出存檔</button>
          <button data-action="import-data">匯入存檔</button>
        </div>
        <input data-import-file type="file" accept="application/json,.json" hidden>
      </section>
    </section>
  `;
}

function renderStudyTools() {
  const selected = getSelectedWord();
  return `
    <div class="tabs">
      ${["詞彙", "語法"].map((tab) => `<button data-tab="${tab}" class="${state.activeTool === tab ? "active" : ""}">${tab}</button>`).join("")}
    </div>
    ${state.activeTool === "詞彙" ? renderVocabularyTool(selected) : renderGrammarTool()}
  `;
}

function renderVocabularyTool(selected) {
  const lookupKey = selectedLookupKey(selected);
  const lookup = state.lexiconLookup.key === lookupKey ? state.lexiconLookup.result : null;
  const status = state.lexiconLookup.key === lookupKey ? state.lexiconLookup.status : "idle";
  const lookupLemma = lookup ? lookup.lemma : "";
  const lookupMorphology = lookup ? lookup.morphology : "";
  const lookupStrong = lookup ? lookup.strong : "";
  const lookupSource = lookup ? lookup.source : "";
  return `
    <section class="tool-section">
      <p class="label">選取單字</p>
      <div class="inspector">
        <strong>${escapeHtml(selected.word)}</strong>
        <dl>
          <div><dt>lemma</dt><dd>${escapeHtml(lookupLemma || lookupStatusText(status, lookupSource))}</dd></div>
          <div><dt>形態</dt><dd>${escapeHtml(lookupMorphology || lookupStatusText(status, lookupSource))}</dd></div>
          <div><dt>Strong</dt><dd>${escapeHtml(lookupStrong || lookupStatusText(status, lookupSource))}</dd></div>
          <div><dt>來源</dt><dd>${lookupSource === "local" ? "本地 OpenGNT" : lookupStatusText(status, lookupSource)}</dd></div>
        </dl>
        <div class="button-row">
          <button data-action="lookup-local-word" ${status === "loading" ? "disabled" : ""}>${status === "loading" ? "查詢中" : "查詢本地詞彙"}</button>
          ${lookupMorphology ? `<button data-action="fill-local-morphology" data-morphology="${escapeAttr(lookupMorphology)}">填入解析</button>` : ""}
          <a class="lookup-link" href="${escapeAttr(makeExternalLookupUrl(selected.word))}" target="_blank" rel="noreferrer">網路查詢</a>
        </div>
      </div>
    </section>
  `;
}

function renderGrammarTool() {
  return `
    <section class="tool-section">
      <div class="section-title">
        <p class="label">語法標記</p>
        <button data-action="add-tag">＋ 新增標記</button>
      </div>
      <div class="tag-list">
        ${tagStore.list().map((tag) => `
          <span class="tag-chip">
            <button data-action="insert-tag" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>
            <button data-action="remove-tag" data-tag="${escapeAttr(tag)}" aria-label="delete ${tag}">×</button>
          </span>
        `).join("")}
      </div>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-picker]").forEach((select) => {
    select.addEventListener("change", (event) => {
      const key = event.currentTarget.dataset.picker;
      state.picker[key] = event.currentTarget.value;
      if (key === "book") {
        state.picker.chapter = "1";
        state.picker.verse = "1";
      }
      if (key === "chapter") {
        state.picker.verse = "1";
      }
      render();
    });
  });

  app.querySelectorAll("input[data-row]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const verseId = event.currentTarget.dataset.verseId;
      const row = event.currentTarget.dataset.row;
      const index = Number(event.currentTarget.dataset.index);
      const lineStart = Number(event.currentTarget.dataset.lineStart);
      updateVerse(verseId, (verse) => {
        if (row === "translation") return { ...verse, translation: event.currentTarget.value };
        if (row === "lineTranslation") return updateVerseLineTranslation(verse, lineStart, event.currentTarget.value);
        return updateVerseCell(verse, row, index, event.currentTarget.value);
      });
      persistActiveDraft();
    });
    input.addEventListener("keydown", handleInputKeydown);
    input.addEventListener("focus", handleInputFocus);
  });

  const lessonNameInput = app.querySelector("[data-lesson-name]");
  if (lessonNameInput) {
    lessonNameInput.addEventListener("input", (event) => {
      state.lessonName = event.currentTarget.value;
    });
  }

  const lessonPicker = app.querySelector("[data-lesson-picker]");
  if (lessonPicker) {
    lessonPicker.addEventListener("change", (event) => {
      state.selectedLessonId = event.currentTarget.value;
      if (state.selectedLessonId) {
        loadSelectedLesson();
        return;
      }
      state.lessonName = "";
      renderPreservingSidePanelScroll();
    });
  }

  const densityRange = app.querySelector("[data-density-range]");
  if (densityRange) {
    densityRange.addEventListener("input", (event) => {
      state.layoutDensity = densityFromSliderValue(event.currentTarget.value);
      render();
    });
  }

  const importFileInput = app.querySelector("[data-import-file]");
  if (importFileInput) {
    importFileInput.addEventListener("change", handleImportFile);
  }

  app.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleAction);
  });

  app.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.activeTool = event.currentTarget.dataset.tab;
      renderPreservingSidePanelScroll();
    });
  });
}

function handleInputKeydown(event) {
  rememberKeyboardWordIndex(event.currentTarget);
  if (isImeComposing(event)) return;
  if (isArrowKey(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
    if (!shouldMoveBetweenInputsByArrowKey({ key: event.key, input: event.currentTarget })) return;
    moveByArrowKey(event);
    return;
  }
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
  const currentKey = event.currentTarget.dataset.tabKey;
  if (!currentKey) return;

  const inputs = horizontalTabInputs();
  const orderedKeys = inputs.map((input) => input.dataset.tabKey);
  const nextKey = nextHorizontalTabKey(currentKey, orderedKeys, { backwards: event.shiftKey });
  if (!nextKey) return;

  const target = inputs.find((input) => input.dataset.tabKey === nextKey);
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.select();
}

function handleInputFocus(event) {
  const verseId = event.currentTarget.dataset.verseId;
  if (!verseId) return;
  const index = Number(event.currentTarget.dataset.index);
  state.selected = {
    verseId,
    wordIndex: Number.isFinite(index) ? index : state.lastKeyboardWordIndex
  };
  rememberKeyboardWordIndex(event.currentTarget);
}

function moveByArrowKey(event) {
  const currentKey = event.currentTarget.dataset.tabKey;
  const verseId = event.currentTarget.dataset.verseId;
  const verse = state.verses.find((item) => item.id === verseId);
  if (!currentKey || !verse) return;

  const nextKey = nextArrowKey(currentKey, event.key, {
    wordCount: verse.words.length,
    fallbackIndex: state.lastKeyboardWordIndex
  });
  if (!nextKey) return;

  const target = horizontalTabInputs().find((input) => input.dataset.tabKey === nextKey);
  if (!target) return;
  event.preventDefault();
  target.focus();
  target.select();
  rememberKeyboardWordIndex(target);
}

function rememberKeyboardWordIndex(input) {
  if (input.dataset.index == null) return;
  const index = Number(input.dataset.index);
  if (Number.isFinite(index)) state.lastKeyboardWordIndex = index;
}

function isArrowKey(key) {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown";
}

function isImeComposing(event) {
  return event.isComposing || event.key === "Process" || event.keyCode === 229;
}

function horizontalTabInputs() {
  const rows = ["syntax", "morphology", "gloss"];
  return Array.from(app.querySelectorAll(".verse-block")).flatMap((block) => {
    const parsingInputs = rows.flatMap((row) => Array.from(block.querySelectorAll(`input[data-row="${row}"]`))
      .sort((left, right) => Number(left.dataset.index) - Number(right.dataset.index)));
    const translation = block.querySelector('input[data-row="translation"]');
    return translation ? [...parsingInputs, translation] : parsingInputs;
  });
}

function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;
  if (action === "add-verse") addSelectedVerse();
  if (action === "edit-greek") editSelectedGreek();
  if (action === "cancel-greek-edit") closeGreekEditor();
  if (action === "save-greek-edit") saveGreekEditor();
  if (action === "set-edit") {
    state.printMode = false;
    render();
  }
  if (action === "set-print") {
    state.printMode = true;
    render();
  }
  if (action === "set-landscape") {
    state.pageOrientation = "landscape";
    render();
  }
  if (action === "set-portrait") {
    state.pageOrientation = "portrait";
    render();
  }
  if (action === "set-translation-mode") {
    state.translationMode = button.dataset.translationMode === "line" ? "line" : "verse";
    render();
  }
  if (action === "toggle-reflow") {
    state.reflowMode = !state.reflowMode;
    render();
  }
  if (action === "toggle-projection") {
    state.projectionMode = !state.projectionMode;
    render();
  }
  if (action === "toggle-side-panel") {
    state.sidePanelCollapsed = !state.sidePanelCollapsed;
    render();
  }
  if (action === "save-text") saveWorksheetText();
  if (action === "save-docx") saveWorksheetDocx();
  if (action === "print") printWorksheet();
  if (action === "remove-verse") removeVerse(button.dataset.verseId);
  if (action === "clear-verse") clearVerse(button.dataset.verseId);
  if (action === "clear-page") clearPageAnswers();
  if (action === "new-practice-page") newPracticePage();
  if (action === "save-standard-answer") saveVerseAsStandardAnswer(button.dataset.verseId);
  if (action === "toggle-standard-answer") toggleStandardAnswer(button.dataset.reference);
  if (action === "select-word") selectWord(button.dataset.verseId, Number(button.dataset.index));
  if (action === "set-word-color") setSelectedWordColor(button.dataset.wordColor || "");
  if (action === "toggle-line-break") toggleManualLineBreak(button.dataset.verseId, Number(button.dataset.index));
  if (action === "toggle-study-tools") {
    state.showStudyTools = !state.showStudyTools;
    state.activeTool = "語法";
    renderPreservingSidePanelScroll();
  }
  if (action === "insert-tag") insertTag(button.dataset.tag);
  if (action === "remove-tag") {
    tagStore.remove(button.dataset.tag);
    renderPreservingSidePanelScroll();
  }
  if (action === "add-tag") addTag();
  if (action === "lookup-local-word") lookupSelectedWord();
  if (action === "fill-local-morphology") fillLocalMorphology(button.dataset.morphology);
  if (action === "save-lesson") saveCurrentLesson();
  if (action === "delete-lesson") deleteSelectedLesson();
  if (action === "export-data") exportSavedData();
  if (action === "import-data") {
    const input = app.querySelector("[data-import-file]");
    if (input) input.click();
  }
}

function choicesFor(kind) {
  if (kind === "chapter") {
    return chaptersFor(state.picker.book);
  }
  return versesFor(state.picker.book, state.picker.chapter);
}

function addSelectedVerse() {
  const version = activeGreekTextVersion();
  const greek = getGreekText(state.picker, version.verses);
  if (!greek) {
    window.alert(`這個節號在目前選用的 ${version.name} 資料中沒有獨立希臘文。你仍可用「編輯希臘文」手動貼上。`);
    return;
  }
  const verse = createBlankExercise({
    id: createId(),
    reference: referenceFor(state.picker),
    greek
  });
  state.verses = [...state.verses, verse];
  state.selected = { verseId: verse.id, wordIndex: 0 };
  render();
}

function editSelectedGreek() {
  const verseId = preferredVerseIdForEditing({
    activeElement: document.activeElement,
    selectedVerseId: state.selected.verseId
  });
  const verse = state.verses.find((item) => item.id === verseId);
  state.greekEditor = {
    verseId: verse ? verse.id : null,
    greek: verse ? verse.greek : ""
  };
  render();
}

function closeGreekEditor() {
  state.greekEditor = null;
  render();
}

function saveGreekEditor() {
  if (!state.greekEditor) return;
  const input = app.querySelector("[data-greek-editor]");
  const nextGreek = input ? input.value.trim() : state.greekEditor.greek.trim();
  const verse = state.verses.find((item) => item.id === state.greekEditor.verseId);
  if (verse) {
    updateVerse(verse.id, (current) => updateVerseGreek(current, nextGreek));
    persistActiveLessonGreekText();
    persistActiveDraft();
  } else if (nextGreek) {
    const custom = createBlankExercise({
      id: createId(),
      reference: "自訂經文",
      greek: nextGreek
    });
    state.verses = [...state.verses, custom];
    state.selected = { verseId: custom.id, wordIndex: 0 };
  }
  state.greekEditor = null;
  render();
}

function removeVerse(verseId) {
  state.verses = state.verses.filter((verse) => verse.id !== verseId);
  state.selected = { verseId: state.verses[0] ? state.verses[0].id : null, wordIndex: 0 };
  render();
}

function clearVerse(verseId) {
  state.verses = state.verses.map((verse) => verse.id === verseId ? clearVerseAnswers(verse) : verse);
  persistActiveDraft();
  render();
}

function clearPageAnswers() {
  state.verses = clearAllAnswers(state.verses);
  clearActiveDraft();
  render();
}

function toggleManualLineBreak(verseId, index) {
  updateVerse(verseId, (verse) => toggleLineBreakAfter(verse, index));
  persistActiveDraft();
  render();
}

function newPracticePage() {
  const confirmed = window.confirm("清空本頁所有經文，開始新的空白練習頁？已儲存的課程組和標準答案不會被刪除。");
  if (!confirmed) return;
  Object.assign(state, clearPracticePage(state));
  render();
}

function saveVerseAsStandardAnswer(verseId) {
  const verse = state.verses.find((item) => item.id === verseId);
  if (!verse) return;
  state.standardAnswers = saveStandardAnswer(state.standardAnswers, verse);
  state.expandedStandardAnswers = {
    ...state.expandedStandardAnswers,
    [verse.reference]: true
  };
  saveStandardAnswers(state.standardAnswers);
  render();
}

function toggleStandardAnswer(reference) {
  state.expandedStandardAnswers = {
    ...state.expandedStandardAnswers,
    [reference]: !state.expandedStandardAnswers[reference]
  };
  render();
}

function selectWord(verseId, wordIndex) {
  state.selected = { verseId, wordIndex };
  render();
}

async function lookupSelectedWord() {
  const selected = getSelectedWord();
  const key = selectedLookupKey(selected);
  state.lexiconLookup = { key, status: "loading", result: null };
  renderPreservingSidePanelScroll();
  const result = await lookupWord(selected);
  state.lexiconLookup = { key, status: "done", result };
  renderPreservingSidePanelScroll();
}

function insertTag(tag) {
  const { verseId, wordIndex } = state.selected;
  if (!verseId) return;
  updateVerse(verseId, (verse) => updateVerseCell(verse, "syntax", wordIndex, tag));
  persistActiveDraft();
  renderPreservingSidePanelScroll();
}

function addTag() {
  const tag = window.prompt("新增語法標記，例如 PP~Adj");
  if (!tag) return;
  tagStore.add(tag);
  renderPreservingSidePanelScroll();
}

function fillLocalMorphology(morphology) {
  const { verseId, wordIndex } = state.selected;
  if (!verseId || !morphology) return;
  updateVerse(verseId, (verse) => updateVerseCell(verse, "morphology", wordIndex, morphology));
  persistActiveDraft();
  renderPreservingSidePanelScroll();
}

function setSelectedWordColor(color) {
  const { verseId, wordIndex } = state.selected;
  if (!verseId) return;
  updateVerse(verseId, (verse) => updateVerseWordColor(verse, wordIndex, color));
  persistActiveDraft();
  renderPreservingSidePanelScroll();
}

function updateVerse(verseId, updater) {
  state.verses = state.verses.map((verse) => verse.id === verseId ? updater(verse) : verse);
}

function printWorksheet() {
  applyPrintOrientation();
  window.print();
}

function saveWorksheetText() {
  const text = formatWorksheetText({
    ...worksheetExportOptions()
  });
  downloadTextFile(text, worksheetTextFilename());
}

function saveWorksheetDocx() {
  const blob = createWorksheetDocxBlob({
    ...worksheetExportOptions()
  });
  downloadBlob(blob, worksheetDocxFilename());
}

function worksheetExportOptions() {
  return {
    verses: state.verses,
    lessonName: normalizeLessonName(state.lessonName),
    sourceLabel: activeGreekTextSourceLabel(),
    translationMode: state.translationMode,
    pageOrientation: state.pageOrientation,
    maxColumns: state.printMode
      ? maxPrintColumns(state.pageOrientation, state.layoutDensity)
      : maxEditColumns(state.layoutDensity),
    standardAnswers: state.standardAnswers,
    expandedStandardAnswers: state.expandedStandardAnswers
  };
}

function exportSavedData() {
  const archive = createDataArchive({
    lessons: state.lessons,
    practiceDrafts: state.practiceDrafts,
    standardAnswers: state.standardAnswers
  });
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
  downloadBlob(blob, `greek-parsing-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function worksheetTextFilename() {
  const date = new Date().toISOString().slice(0, 10);
  const label = state.verses.length
    ? state.verses.map((verse) => verse.reference).join("_")
    : "blank-page";
  return `greek-parsing-${slugifyFilename(label)}-${date}.txt`;
}

function worksheetDocxFilename() {
  const date = new Date().toISOString().slice(0, 10);
  const label = state.verses.length
    ? state.verses.map((verse) => verse.reference).join("_")
    : "blank-page";
  return `greek-parsing-${slugifyFilename(label)}-${date}.docx`;
}

function slugifyFilename(value) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "worksheet";
}

function handleImportFile(event) {
  const [file] = event.currentTarget.files || [];
  event.currentTarget.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      importSavedData(String(reader.result || ""));
    } catch (error) {
      window.alert(error && error.message ? error.message : "匯入存檔失敗。");
    }
  });
  reader.addEventListener("error", () => {
    window.alert("無法讀取這個存檔。");
  });
  reader.readAsText(file);
}

function importSavedData(text) {
  const imported = parseDataArchive(text);
  const confirmed = window.confirm(`${importSummary(imported)}\n同 ID 的課程、草稿與同經文標準答案會被匯入資料覆蓋。`);
  if (!confirmed) return;

  const merged = mergeImportedData({
    lessons: state.lessons,
    practiceDrafts: state.practiceDrafts,
    standardAnswers: state.standardAnswers
  }, imported);
  state.lessons = merged.lessons;
  state.practiceDrafts = merged.practiceDrafts;
  state.standardAnswers = merged.standardAnswers;
  saveLessons(state.lessons);
  savePracticeDrafts(state.practiceDrafts);
  saveStandardAnswers(state.standardAnswers);
  render();
}

function activeGreekTextVersion() {
  return DEFAULT_GREEK_TEXT_VERSION;
}

function activeGreekTextSourceLabel() {
  return greekTextSourceLabel(activeGreekTextVersion());
}

function applyPrintOrientation() {
  let style = document.querySelector("#print-orientation");
  if (!style) {
    style = document.createElement("style");
    style.id = "print-orientation";
    document.head.appendChild(style);
  }
  style.textContent = printPageRule(state.pageOrientation);
}

function saveCurrentLesson() {
  if (!state.verses.length) return;
  const name = normalizeLessonName(state.lessonName);
  if (!name) {
    window.alert("請先輸入課程名稱。");
    return;
  }

  const lesson = createLessonRecord({
    id: state.selectedLessonId || createId(),
    name,
    verses: state.verses
  });
  const others = state.lessons.filter((item) => item.id !== lesson.id);
  state.lessons = [...others, lesson];
  state.selectedLessonId = lesson.id;
  state.activeLessonId = lesson.id;
  state.lessonName = lesson.name;
  saveLessons(state.lessons);
  persistActiveDraft();
  render();
}

function loadSelectedLesson() {
  const lesson = selectedLesson();
  if (!lesson) return;
  const blankVerses = hydrateLesson(lesson, () => createId());
  state.verses = applyPracticeDraft(blankVerses, state.practiceDrafts[lesson.id]);
  state.selected = { verseId: state.verses[0] ? state.verses[0].id : null, wordIndex: 0 };
  state.activeLessonId = lesson.id;
  state.lessonName = lesson.name;
  renderPreservingSidePanelScroll();
}

function deleteSelectedLesson() {
  const lesson = selectedLesson();
  if (!lesson) return;
  const confirmed = window.confirm(`刪除課程「${lesson.name}」？`);
  if (!confirmed) return;
  state.lessons = state.lessons.filter((item) => item.id !== lesson.id);
  state.practiceDrafts = clearPracticeDraft(state.practiceDrafts, lesson.id);
  Object.assign(state, clearPracticePage(state));
  saveLessons(state.lessons);
  savePracticeDrafts(state.practiceDrafts);
  renderPreservingSidePanelScroll();
}

function selectedLesson() {
  return state.lessons.find((lesson) => lesson.id === state.selectedLessonId);
}

function persistActiveDraft() {
  if (!state.activeLessonId) return;
  state.practiceDrafts = savePracticeDraft(state.practiceDrafts, state.activeLessonId, state.verses);
  savePracticeDrafts(state.practiceDrafts);
}

function persistActiveLessonGreekText() {
  if (!state.activeLessonId) return;
  const activeLesson = state.lessons.find((item) => item.id === state.activeLessonId);
  if (!activeLesson) return;
  const updatedLesson = createLessonRecord({
    id: activeLesson.id,
    name: activeLesson.name,
    verses: state.verses,
    createdAt: activeLesson.createdAt
  });
  state.lessons = state.lessons.map((item) => item.id === state.activeLessonId ? updatedLesson : item);
  state.selectedLessonId = activeLesson.id;
  state.lessonName = activeLesson.name;
  saveLessons(state.lessons);
}

function clearActiveDraft() {
  if (!state.activeLessonId) return;
  state.practiceDrafts = clearPracticeDraft(state.practiceDrafts, state.activeLessonId);
  savePracticeDrafts(state.practiceDrafts);
}

function getSelectedWord() {
  const verse = state.verses.find((item) => item.id === state.selected.verseId);
  if (!verse) {
    return { word: "未選取", morphology: "", gloss: "" };
  }
  const word = verse.words[state.selected.wordIndex] == null ? (verse.words[0] || "") : verse.words[state.selected.wordIndex];
  const fallbackMorphology = verse.morphology[state.selected.wordIndex] == null ? "" : verse.morphology[state.selected.wordIndex];
  const fallbackGloss = verse.gloss[state.selected.wordIndex] == null ? "" : verse.gloss[state.selected.wordIndex];
  return {
    word,
    reference: verse.reference,
    wordIndex: state.selected.wordIndex,
    morphology: fallbackMorphology,
    gloss: fallbackGloss
  };
}

function selectedLookupKey(selected) {
  const reference = selected.reference == null ? "" : selected.reference;
  const wordIndex = selected.wordIndex == null ? "" : selected.wordIndex;
  return `${reference}.${wordIndex}`;
}

function lookupStatusText(status, source = "") {
  if (status === "loading") return "查詢中";
  if (source === "unaligned") return "詞形無法與本地資料對齊";
  if (status === "done") return "本地無資料";
  return "尚未查詢";
}

function columnSize(word, verse, index) {
  const syntaxLength = verse.syntax[index] ? verse.syntax[index].length : 0;
  const morphologyLength = verse.morphology[index] ? verse.morphology[index].length : 0;
  const glossLength = verse.gloss[index] ? verse.gloss[index].length : 0;
  return Math.max(word.length, syntaxLength, morphologyLength, glossLength, 4);
}

function densitySliderValue(density) {
  const normalized = normalizeLayoutDensity(density);
  return String(DENSITY_OPTIONS.indexOf(normalized));
}

function densityFromSliderValue(value) {
  const index = Number(value);
  return DENSITY_OPTIONS[index] || "standard";
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function tabKey(verseId, row, index = "") {
  return `${verseId}:${row}:${index}`;
}

function createId() {
  const root = typeof globalThis === "undefined" ? window : globalThis;
  if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
