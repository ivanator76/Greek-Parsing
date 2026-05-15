import { updateVerseCell, updateVerseGreek, wrapVerse } from "./layout.js";
import { escapeHtml } from "./escape.js";
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
import {
  applyPracticeDraft,
  clearPracticeDraft,
  loadPracticeDrafts,
  savePracticeDraft,
  savePracticeDrafts
} from "./practice-drafts.js";
import { maxPrintColumns, printPageRule } from "./print-layout.js";
import { createInitialState } from "./state.js";
import {
  hasStandardAnswer,
  loadStandardAnswers,
  saveStandardAnswer,
  saveStandardAnswers
} from "./standard-answers.js";
import { createTagStore } from "./tags.js";
import { nextArrowKey, nextHorizontalTabKey } from "./tab-order.js";
import { GREEK_TEXT_SOURCE } from "./text-source.js";
import { createBlankExercise } from "./worksheet.js";

const BOOKS = books();
const DEFAULT_TAGS = ["S", "V+N", "V+G", "V+D", "V+A", "Prp", "NP+G", "V+IP", "PP~Adj", "PP~Adv"];
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
  try {
    render();
    document.documentElement.setAttribute("data-app-ready", "true");
  } catch (error) {
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
  app.innerHTML = `
    <div class="shell ${state.printMode ? "is-print-mode" : ""} is-${state.pageOrientation}">
      ${renderToolbar()}
      <main class="workspace">
        <section class="page-wrap">
          <div class="paper" aria-label="A4 parsing worksheet">
            <header class="paper-header">
              <div>
                <p class="eyebrow">Koine Greek Parsing</p>
                <h1>五行分析練習</h1>
                <p class="text-source">${escapeHtml(GREEK_TEXT_SOURCE)}</p>
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
    </div>
  `;
  bindEvents();
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
      <button data-action="new-practice-page">空白頁</button>
      <button data-action="edit-greek">✎ 編輯希臘文</button>
      <div class="segmented" role="group" aria-label="view mode">
        <button data-action="set-edit" class="${state.printMode ? "" : "active"}">編輯</button>
        <button data-action="set-print" class="${state.printMode ? "active" : ""}">A4列印</button>
      </div>
      <div class="segmented" role="group" aria-label="page orientation">
        <button data-action="set-landscape" class="${state.pageOrientation === "landscape" ? "active" : ""}">橫式</button>
        <button data-action="set-portrait" class="${state.pageOrientation === "portrait" ? "active" : ""}">直式</button>
      </div>
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

function renderVerse(verse) {
  const segments = wrapVerse(verse, { maxColumns: state.printMode ? maxPrintColumns(state.pageOrientation) : 6 });
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
  const columns = segment.words.map((word, offset) => {
    const index = segment.start + offset;
    const selected = state.selected.verseId === verse.id && state.selected.wordIndex === index;
    return `
      <div class="word-column ${selected ? "selected" : ""}" style="--chars:${columnSize(word, verse, index)}" data-word-index="${index}" data-verse-id="${verse.id}">
        <input class="syntax-input" value="${escapeAttr(segment.syntax[offset])}" data-row="syntax" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "syntax", index))}" aria-label="syntax for ${word}">
        <button class="greek-word" data-action="select-word" data-index="${index}" data-verse-id="${verse.id}">${escapeHtml(word)}</button>
        <input value="${escapeAttr(segment.morphology[offset])}" data-row="morphology" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "morphology", index))}" aria-label="morphology for ${word}">
        <input value="${escapeAttr(segment.gloss[offset])}" data-row="gloss" data-index="${index}" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "gloss", index))}" aria-label="gloss for ${word}">
      </div>
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
      ${segment.showTranslation ? `
        <label class="translation-line">
          <b>5</b>
          <span>整句翻譯</span>
          <input value="${escapeAttr(segment.translation)}" data-row="translation" data-verse-id="${verse.id}" data-tab-key="${escapeAttr(tabKey(verse.id, "translation"))}">
        </label>
      ` : ""}
    </section>
  `;
}

function renderSidePanel() {
  return `
    <aside class="side-panel">
      <h2>本頁</h2>
      <button class="wide-button primary" data-action="new-practice-page">空白頁</button>
      ${renderPagePanel()}
      <button class="reveal-tools" data-action="toggle-study-tools">${state.showStudyTools ? "隱藏詞彙 / 語法工具" : "顯示詞彙 / 語法工具"}</button>
      ${state.showStudyTools ? renderStudyTools() : ""}
    </aside>
  `;
}

function renderPagePanel() {
  if (!state.verses.length) {
    return `
      <p class="panel-note">本頁還沒有經文。新增經文後，這裡會列出本頁題目。</p>
      ${renderLessonPanel()}
    `;
  }

  return `
    <ol class="page-list">
      ${state.verses.map((verse, index) => `
        <li>
          <span>${index + 1}. ${escapeHtml(verse.reference)}</span>
          <small>${verse.words.length} words</small>
        </li>
      `).join("")}
    </ol>
    <button class="wide-button" data-action="clear-page">清空本頁答案</button>
    ${renderLessonPanel()}
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
      <label class="stacked-label">
        已儲存課程
        <select data-lesson-picker>
          <option value="">選擇課程</option>
          ${state.lessons.map((lesson) => `
            <option value="${escapeAttr(lesson.id)}" ${lesson.id === state.selectedLessonId ? "selected" : ""}>
              ${escapeHtml(lesson.name)}
            </option>
          `).join("")}
        </select>
      </label>
      <div class="button-row wrap">
        <button data-action="load-lesson" ${state.selectedLessonId ? "" : "disabled"}>載入課程</button>
        <button data-action="delete-lesson" ${state.selectedLessonId ? "" : "disabled"}>刪除課程</button>
      </div>
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
          <div><dt>lemma</dt><dd>${escapeHtml(lookupLemma || lookupStatusText(status))}</dd></div>
          <div><dt>形態</dt><dd>${escapeHtml(lookupMorphology || lookupStatusText(status))}</dd></div>
          <div><dt>Strong</dt><dd>${escapeHtml(lookupStrong || lookupStatusText(status))}</dd></div>
          <div><dt>來源</dt><dd>${lookupSource === "local" ? "本地 MorphGNT Tischendorf" : lookupStatusText(status)}</dd></div>
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
      updateVerse(verseId, (verse) => row === "translation"
        ? { ...verse, translation: event.currentTarget.value }
        : updateVerseCell(verse, row, index, event.currentTarget.value));
      persistActiveDraft();
    });
    input.addEventListener("keydown", handleInputKeydown);
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
      const lesson = selectedLesson();
      if (lesson) state.lessonName = lesson.name;
      render();
    });
  }

  app.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleAction);
  });

  app.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.activeTool = event.currentTarget.dataset.tab;
      render();
    });
  });
}

function handleInputKeydown(event) {
  rememberKeyboardWordIndex(event.currentTarget);
  if (isArrowKey(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
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
  if (action === "print") printWorksheet();
  if (action === "remove-verse") removeVerse(button.dataset.verseId);
  if (action === "clear-verse") clearVerse(button.dataset.verseId);
  if (action === "clear-page") clearPageAnswers();
  if (action === "new-practice-page") newPracticePage();
  if (action === "save-standard-answer") saveVerseAsStandardAnswer(button.dataset.verseId);
  if (action === "toggle-standard-answer") toggleStandardAnswer(button.dataset.reference);
  if (action === "select-word") selectWord(button.dataset.verseId, Number(button.dataset.index));
  if (action === "toggle-study-tools") {
    state.showStudyTools = !state.showStudyTools;
    state.activeTool = "語法";
    render();
  }
  if (action === "insert-tag") insertTag(button.dataset.tag);
  if (action === "remove-tag") {
    tagStore.remove(button.dataset.tag);
    render();
  }
  if (action === "add-tag") addTag();
  if (action === "lookup-local-word") lookupSelectedWord();
  if (action === "fill-local-morphology") fillLocalMorphology(button.dataset.morphology);
  if (action === "save-lesson") saveCurrentLesson();
  if (action === "load-lesson") loadSelectedLesson();
  if (action === "delete-lesson") deleteSelectedLesson();
}

function choicesFor(kind) {
  if (kind === "chapter") {
    return chaptersFor(state.picker.book);
  }
  return versesFor(state.picker.book, state.picker.chapter);
}

function addSelectedVerse() {
  const greek = getGreekText(state.picker);
  if (!greek) {
    window.alert("這個節號在目前匯入的 Tischendorf 資料中沒有獨立希臘文。你仍可用「編輯希臘文」手動貼上。");
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
  const verse = state.verses.find((item) => item.id === state.selected.verseId);
  const nextGreek = window.prompt("編輯希臘文", verse ? verse.greek : "");
  if (!nextGreek) return;
  if (verse) {
    updateVerse(verse.id, (current) => updateVerseGreek(current, nextGreek));
  } else {
    const custom = createBlankExercise({
      id: createId(),
      reference: "自訂經文",
      greek: nextGreek
    });
    state.verses = [...state.verses, custom];
    state.selected = { verseId: custom.id, wordIndex: 0 };
  }
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
  render();
  const result = await lookupWord(selected);
  state.lexiconLookup = { key, status: "done", result };
  render();
}

function insertTag(tag) {
  const { verseId, wordIndex } = state.selected;
  if (!verseId) return;
  updateVerse(verseId, (verse) => updateVerseCell(verse, "syntax", wordIndex, tag));
  persistActiveDraft();
  render();
}

function addTag() {
  const tag = window.prompt("新增語法標記，例如 PP~Adj");
  if (!tag) return;
  tagStore.add(tag);
  render();
}

function fillLocalMorphology(morphology) {
  const { verseId, wordIndex } = state.selected;
  if (!verseId || !morphology) return;
  updateVerse(verseId, (verse) => updateVerseCell(verse, "morphology", wordIndex, morphology));
  persistActiveDraft();
  render();
}

function updateVerse(verseId, updater) {
  state.verses = state.verses.map((verse) => verse.id === verseId ? updater(verse) : verse);
}

function printWorksheet() {
  applyPrintOrientation();
  window.print();
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
  render();
}

function deleteSelectedLesson() {
  const lesson = selectedLesson();
  if (!lesson) return;
  const confirmed = window.confirm(`刪除課程「${lesson.name}」？`);
  if (!confirmed) return;
  state.lessons = state.lessons.filter((item) => item.id !== lesson.id);
  state.practiceDrafts = clearPracticeDraft(state.practiceDrafts, lesson.id);
  state.selectedLessonId = "";
  if (state.activeLessonId === lesson.id) state.activeLessonId = "";
  saveLessons(state.lessons);
  savePracticeDrafts(state.practiceDrafts);
  render();
}

function selectedLesson() {
  return state.lessons.find((lesson) => lesson.id === state.selectedLessonId);
}

function persistActiveDraft() {
  if (!state.activeLessonId) return;
  state.practiceDrafts = savePracticeDraft(state.practiceDrafts, state.activeLessonId, state.verses);
  savePracticeDrafts(state.practiceDrafts);
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

function lookupStatusText(status) {
  if (status === "loading") return "查詢中";
  if (status === "done") return "本地無資料";
  return "尚未查詢";
}

function columnSize(word, verse, index) {
  const syntaxLength = verse.syntax[index] ? verse.syntax[index].length : 0;
  const morphologyLength = verse.morphology[index] ? verse.morphology[index].length : 0;
  const glossLength = verse.gloss[index] ? verse.gloss[index].length : 0;
  return Math.max(word.length, syntaxLength, morphologyLength, glossLength, 4);
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
