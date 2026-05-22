import { wrapVerse } from "./layout.js";
import { GREEK_TEXT_SOURCE } from "./text-source.js";
import { createZip } from "./zip-store.js";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function createWorksheetDocxBlob({
  verses,
  sourceLabel = GREEK_TEXT_SOURCE,
  translationMode = "verse",
  maxColumns = 6,
  standardAnswers = {},
  expandedStandardAnswers = {}
}) {
  const files = [
    { name: "[Content_Types].xml", content: contentTypesXml() },
    { name: "_rels/.rels", content: packageRelsXml() },
    { name: "word/styles.xml", content: stylesXml() },
    {
      name: "word/document.xml",
      content: documentXml({ verses, sourceLabel, translationMode, maxColumns, standardAnswers, expandedStandardAnswers })
    }
  ];
  return new Blob([createZip(files)], { type: DOCX_TYPE });
}

function documentXml({ verses, sourceLabel, translationMode, maxColumns, standardAnswers, expandedStandardAnswers }) {
  const body = [];
  body.push(headingParagraph("Koine Greek Parsing", "Title"));
  body.push(paragraph(sourceLabel, "Subtitle"));

  if (!verses.length) {
    body.push(paragraph("尚未加入經文"));
  } else {
    verses.forEach((verse) => {
      body.push(headingParagraph(verse.reference, "Heading1"));
      wrapVerse(verse, { maxColumns }).forEach((segment) => {
        body.push(segmentParagraphs(segment, translationMode));
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

  body.push(sectionProperties());
  return xmlDocument(body.join(""));
}

function segmentParagraphs(segment, translationMode) {
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
  return `${rows.map((row) => rowParagraph(row, columnCount, row[0] === "2" ? "GreekRow" : "CellText")).join("")}${paragraph("")}`;
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

function rowParagraph(values, columnCount, style) {
  const tabs = tabStops(columnCount);
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="${style}"/>
        <w:tabs>${tabs.map((position) => `<w:tab w:val="left" w:pos="${position}"/>`).join("")}</w:tabs>
        <w:spacing w:after="80"/>
      </w:pPr>
      ${tabbedRuns(values)}
    </w:p>
  `;
}

function tabStops(columnCount) {
  const labelWidth = 540;
  const cellWidth = Math.floor((9360 - labelWidth) / columnCount);
  return Array.from({ length: columnCount }, (_, index) => labelWidth + (cellWidth * index));
}

function tabbedRuns(values) {
  return values.map((value, index) => {
    const tab = index === 0 ? "" : "<w:r><w:tab/></w:r>";
    return `${tab}<w:r><w:t xml:space="preserve">${escapeXml(value || "")}</w:t></w:r>`;
  }).join("");
}

function sectionProperties() {
  return `
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  `;
}

function xmlDocument(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
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
</Types>`;
}

function packageRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
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
