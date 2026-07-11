export function createInitialState() {
  return {
    verses: [],
    picker: { book: "Matthew", chapter: "1", verse: "1" },
    selected: { verseId: null, wordIndex: 0 },
    activeTool: "本頁",
    showStudyTools: false,
    printMode: false,
    pageOrientation: "landscape",
    layoutDensity: "standard",
    translationMode: "line",
    reflowMode: false,
    projectionMode: false,
    sidePanelCollapsed: false,
    greekEditor: null,
    lessonName: "",
    selectedLessonId: "",
    activeLessonId: "",
    expandedStandardAnswers: {}
  };
}
