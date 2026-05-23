import { wrapVerse } from "./layout.js";
import { GREEK_TEXT_SOURCE } from "./text-source.js";
import { createZip } from "./zip-store.js";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PAGE_MARGIN_TWIPS = 1440;
const A4_PORTRAIT = { width: 11906, height: 16838 };
const A4_LANDSCAPE = { width: 16838, height: 11906 };
const WORD_COLOR_FILLS = {
  yellow: "FFF3A3",
  green: "BBF7D0",
  blue: "BFDBFE",
  red: "FECACA"
};

export function createWorksheetDocxBlob({
  verses,
  lessonName = "",
  sourceLabel = GREEK_TEXT_SOURCE,
  translationMode = "verse",
  pageOrientation = "landscape",
  maxColumns = 6,
  standardAnswers = {},
  expandedStandardAnswers = {}
}) {
  const page = pageSetup(pageOrientation);
  const files = [
    { name: "[Content_Types].xml", content: contentTypesXml() },
    { name: "_rels/.rels", content: packageRelsXml() },
    { name: "word/_rels/document.xml.rels", content: documentRelsXml() },
    { name: "word/styles.xml", content: stylesXml() },
    { name: "word/header1.xml", content: headerXml(lessonName) },
    { name: "word/footer1.xml", content: footerXml() },
    {
      name: "word/document.xml",
      content: documentXml({ verses, sourceLabel, translationMode, maxColumns, standardAnswers, expandedStandardAnswers, page })
    }
  ];
  return new Blob([createZip(files)], { type: DOCX_TYPE });
}

function documentXml({ verses, sourceLabel, translationMode, maxColumns, standardAnswers, expandedStandardAnswers, page }) {
  const body = [];
  body.push(headingParagraph("Koine Greek Parsing", "Title"));
  body.push(paragraph(sourceLabel, "Subtitle"));

  if (!verses.length) {
    body.push(paragraph("尚未加入經文"));
  } else {
    verses.forEach((verse) => {
      body.push(headingParagraph(verse.reference, "Heading1"));
      wrapVerse(verse, { maxColumns }).forEach((segment) => {
        body.push(segmentParagraphs(segment, translationMode, page.contentWidth));
      });
      const answer = standardAnswers[verse.reference];
      if (answer && expandedStandardAnswers[verse.reference]) {
        body.push(headingParagraph("已顯示標準答案", "Heading2"));
        body.push(answerParagraph("語法", answer.syntax || []));
        body.push(answerParagraph("形態", answer.morphology || []));
        body.push(answerParagraph("逐字", answer.gloss || []));
        body.push(answerParagraph("整句", [answer.translation || ""]));
      }
    });
  }

  body.push(sectionProperties(page));
  return xmlDocument(body.join(""));
}

function segmentParagraphs(segment, translationMode, contentWidth) {
  const rows = [
    ["1", ...segment.syntax],
    ["2", ...segment.words],
    ["3", ...segment.morphology],
    ["4", ...segment.gloss]
  ];
  if (translationMode === "line") {
    rows.push(["5", `本行翻譯 ${segment.lineTranslation || ""}`, ...Array(segment.words.length - 1).fill("")]);
  } else if (segment.showTranslation) {
    rows.push(["5", `整句翻譯 ${segment.translation || ""}`, ...Array(segment.words.length - 1).fill("")]);
  }

  const columnCount = Math.max(segment.words.length, 1);
  const wordColors = ["", ...(segment.wordColors || [])];
  return `${rows.map((row) => rowParagraph(row, columnCount, row[0] === "2" ? "GreekRow" : "CellText", contentWidth, row[0] === "5" ? [] : wordColors)).join("")}${paragraph("")}`;
}

function answerParagraph(label, values) {
  const text = values.map((value) => value || "").join(" | ");
  return paragraph(`${label} ${text}`);
}

function headingParagraph(text, style) {
  return paragraph(text, style);
}

function paragraph(text, style = "Normal") {
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : "";
  return `
    <w:p>
      <w:pPr>${styleXml}</w:pPr>
      <w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>
    </w:p>
  `;
}

function rowParagraph(values, columnCount, style, contentWidth, wordColors = []) {
  const tabs = tabStops(columnCount, contentWidth);
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="${style}"/>
        <w:tabs>${tabs.map((position) => `<w:tab w:val="left" w:pos="${position}"/>`).join("")}</w:tabs>
        <w:spacing w:after="80"/>
      </w:pPr>
      ${tabbedRuns(values, wordColors)}
    </w:p>
  `;
}

function tabStops(columnCount, contentWidth) {
  const labelWidth = 540;
  const cellWidth = Math.floor((contentWidth - labelWidth) / columnCount);
  return Array.from({ length: columnCount }, (_, index) => labelWidth + (cellWidth * index));
}

function tabbedRuns(values, wordColors = []) {
  return values.map((value, index) => {
    const tab = index === 0 ? "" : "<w:r><w:tab/></w:r>";
    return `${tab}<w:r>${runProperties(wordColors[index])}<w:t xml:space="preserve">${escapeXml(value || "")}</w:t></w:r>`;
  }).join("");
}

function runProperties(color) {
  const fill = WORD_COLOR_FILLS[color];
  return fill ? `<w:rPr><w:shd w:fill="${fill}"/></w:rPr>` : "";
}

function sectionProperties(page) {
  const orientation = page.orientation === "landscape" ? ' w:orient="landscape"' : "";
  return `
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rIdHeader1"/>
      <w:footerReference w:type="default" r:id="rIdFooter1"/>
      <w:pgSz w:w="${page.width}" w:h="${page.height}"${orientation}/>
      <w:pgMar w:top="${PAGE_MARGIN_TWIPS}" w:right="${PAGE_MARGIN_TWIPS}" w:bottom="${PAGE_MARGIN_TWIPS}" w:left="${PAGE_MARGIN_TWIPS}" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  `;
}

function pageSetup(pageOrientation) {
  const orientation = pageOrientation === "portrait" ? "portrait" : "landscape";
  const size = orientation === "portrait" ? A4_PORTRAIT : A4_LANDSCAPE;
  return {
    ...size,
    orientation,
    contentWidth: size.width - (PAGE_MARGIN_TWIPS * 2)
  };
}

function xmlDocument(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${body}</w:body>
</w:document>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;
}

function packageRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`;
}

function headerXml(lessonName) {
  const label = lessonName ? `課程組：${lessonName}` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  ${paragraph(label, "HeaderText")}
</w:hdr>`;
}

function footerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="FooterText"/>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r><w:t xml:space="preserve">第 </w:t></w:r>
    ${fieldRun("PAGE")}
    <w:r><w:t xml:space="preserve"> / </w:t></w:r>
    ${fieldRun("NUMPAGES")}
    <w:r><w:t xml:space="preserve"> 頁</w:t></w:r>
  </w:p>
</w:ftr>`;
}

function fieldRun(instruction) {
  return `
    <w:r><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve">${instruction}</w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:t>1</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
  `;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  ${style("Normal", "paragraph", "Normal", 22, "Times New Roman")}
  ${style("Title", "paragraph", "Title", 34, "Arial", true)}
  ${style("Subtitle", "paragraph", "Subtitle", 18, "Arial")}
  ${style("Heading1", "paragraph", "heading 1", 28, "Arial", true)}
  ${style("Heading2", "paragraph", "heading 2", 22, "Arial", true)}
  ${style("CellText", "paragraph", "Cell Text", 20, "Arial")}
  ${style("GreekRow", "paragraph", "Greek Row", 28, "Times New Roman")}
  ${style("HeaderText", "paragraph", "Header Text", 18, "Arial")}
  ${style("FooterText", "paragraph", "Footer Text", 18, "Arial")}
</w:styles>`;
}

function style(id, type, name, size, font, bold = false) {
  return `
    <w:style w:type="${type}" w:styleId="${id}">
      <w:name w:val="${name}"/>
      <w:rPr>
        <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="Microsoft JhengHei"/>
        ${bold ? "<w:b/>" : ""}
        <w:sz w:val="${size}"/>
        <w:szCs w:val="${size}"/>
      </w:rPr>
    </w:style>
  `;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
