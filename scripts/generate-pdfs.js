const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { marked } = require('marked');

// Configure marked for GFM tables and line breaks
marked.setOptions({
  gfm: true,
  breaks: false,
});

const ROOT_DIR = path.resolve(__dirname, '..');
const RESEARCH_MD_PATH = path.join(ROOT_DIR, 'RESEARCH.md');
const DESIGN_MD_PATH = path.join(ROOT_DIR, 'DESIGN.md');
const RESEARCH_PDF_PATH = path.join(ROOT_DIR, 'Research_Note.pdf');
const DESIGN_PDF_PATH = path.join(ROOT_DIR, 'Design_Note.pdf');

function buildHtmlTemplate({ title, subtitle, meta, contentHtml, isResearchNote = false }) {
  const customStyles = isResearchNote ? `
    /* Compact 2-page layout optimizations for Research Note */
    @page {
      size: A4;
      margin: 8mm 11mm 8mm 11mm;
    }
    body {
      font-size: 8.5pt;
      line-height: 1.3;
      color: #1e293b;
    }
    .doc-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .doc-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 2px 0;
    }
    .doc-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 8pt;
      color: #475569;
      margin-top: 2px;
    }
    .doc-meta span {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }
    h2 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-top: 6px;
      margin-bottom: 3px;
      break-after: avoid;
    }
    h3 {
      font-size: 9pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 4px;
      margin-bottom: 1px;
      break-after: avoid;
    }
    p {
      margin: 2px 0 3px 0;
    }
    ul, ol {
      margin: 2px 0 3px 14px;
      padding: 0;
    }
    li {
      margin-bottom: 1px;
    }
    blockquote {
      border-left: 3px solid #2563eb;
      background: #eff6ff;
      margin: 3px 0;
      padding: 3px 8px;
      font-size: 8.2pt;
      color: #1e3a8a;
      border-radius: 0 3px 3px 0;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0 5px 0;
      font-size: 7.2pt;
      line-height: 1.2;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 3px 5px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 5px 0;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
  ` : `
    /* Comprehensive design document styling */
    @page {
      size: A4;
      margin: 10mm 13mm 10mm 13mm;
    }
    body {
      font-size: 9pt;
      line-height: 1.36;
      color: #1e293b;
    }
    .doc-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 3px 0;
    }
    .doc-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 8pt;
      color: #475569;
      margin-top: 4px;
    }
    .doc-meta span {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }
    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-top: 9px;
      margin-bottom: 5px;
      break-after: avoid;
    }
    h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 6px;
      margin-bottom: 3px;
      break-after: avoid;
    }
    p {
      margin: 3px 0 5px 0;
    }
    ul, ol {
      margin: 3px 0 5px 16px;
      padding: 0;
    }
    li {
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 8px 0;
      font-size: 8pt;
      line-height: 1.25;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 7.5pt;
      line-height: 1.28;
      overflow-x: auto;
      margin: 5px 0 8px 0;
      border: 1px solid #1e293b;
      font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
      break-inside: avoid;
    }
    code {
      font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 3px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }
    pre code {
      background: transparent;
      color: #f8fafc;
      padding: 0;
      border: none;
      font-size: 7.5pt;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 8px 0;
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
    }
    ${customStyles}
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;
}

// Convert markdown to clean styled HTML
function convertMarkdownToHtml(markdown, isResearchNote = false) {
  let html = marked.parse(markdown);

  if (isResearchNote) {
    // Specifically split Research Note into Page 1 and Page 2 for a guaranteed clean 2-page fit
    // Section 1 and 2 go on Page 1; Section 3, 4, and 5 go on Page 2
    html = html.replace(
      '<h2 id="3-analysis-of-current-feedback-gaps">3. Analysis of Current Feedback Gaps</h2>',
      '<div class="page-break"></div><h2 id="3-analysis-of-current-feedback-gaps">3. Analysis of Current Feedback Gaps</h2>'
    );
    // In case marked generates non-slugged IDs or plain h2
    if (!html.includes('class="page-break"')) {
      html = html.replace('<h2>3. Analysis of Current Feedback Gaps</h2>', '<div class="page-break"></div><h2>3. Analysis of Current Feedback Gaps</h2>');
    }
  }

  return buildHtmlTemplate({
    title: isResearchNote ? 'LLD Practice Platform — Research Note' : 'LLD Practice Platform — System Architecture & Design',
    contentHtml: html,
    isResearchNote
  });
}

async function countPdfPages(filePath) {
  const buffer = fs.readFileSync(filePath);
  // Count /Type /Page (excluding /Pages)
  const content = buffer.toString('binary');
  const matches = content.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}

async function generatePdfs() {
  console.log('Reading Markdown sources...');
  const researchMd = fs.readFileSync(RESEARCH_MD_PATH, 'utf-8');
  const designMd = fs.readFileSync(DESIGN_MD_PATH, 'utf-8');

  console.log('Generating HTML layouts...');
  const researchHtml = convertMarkdownToHtml(researchMd, true);
  const designHtml = convertMarkdownToHtml(designMd, false);

  console.log('Launching headless Chromium via Playwright...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Generate Research_Note.pdf
    console.log('Rendering Research_Note.pdf...');
    const page1 = await browser.newPage();
    await page1.setContent(researchHtml, { waitUntil: 'load' });
    await page1.pdf({
      path: RESEARCH_PDF_PATH,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;text-align:right;padding-right:14mm;padding-top:4mm;font-family:sans-serif;">LLD Practice Platform — Research Note</div>`,
      footerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;text-align:center;padding-bottom:4mm;font-family:sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      margin: {
        top: '8mm',
        bottom: '8mm',
        left: '10mm',
        right: '10mm'
      }
    });
    await page1.close();

    // 2. Generate Design_Note.pdf
    console.log('Rendering Design_Note.pdf...');
    const page2 = await browser.newPage();
    await page2.setContent(designHtml, { waitUntil: 'load' });
    await page2.pdf({
      path: DESIGN_PDF_PATH,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;text-align:right;padding-right:16mm;padding-top:4mm;font-family:sans-serif;">LLD Practice Platform — System Architecture & Design Document</div>`,
      footerTemplate: `<div style="font-size:7pt;color:#94a3b8;width:100%;text-align:center;padding-bottom:4mm;font-family:sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '12mm',
        right: '12mm'
      }
    });
    await page2.close();

    console.log('PDF generation complete!');

    // Verification
    const researchExists = fs.existsSync(RESEARCH_PDF_PATH);
    const designExists = fs.existsSync(DESIGN_PDF_PATH);

    const researchSize = researchExists ? fs.statSync(RESEARCH_PDF_PATH).size : 0;
    const designSize = designExists ? fs.statSync(DESIGN_PDF_PATH).size : 0;

    const researchPages = await countPdfPages(RESEARCH_PDF_PATH);
    const designPages = await countPdfPages(DESIGN_PDF_PATH);

    console.log('\n--- Verification Results ---');
    console.log(`Research_Note.pdf: exists=${researchExists}, size=${researchSize} bytes, pages=${researchPages}`);
    console.log(`Design_Note.pdf:   exists=${designExists}, size=${designSize} bytes, pages=${designPages}`);

    if (researchPages > 2) {
      console.warn(`WARNING: Research_Note.pdf is ${researchPages} pages (target: 1-2 pages). Needs tighter layout!`);
    } else {
      console.log(`SUCCESS: Research_Note.pdf is within the 1-2 page requirement (${researchPages} pages).`);
    }
  } finally {
    await browser.close();
  }
}

generatePdfs().catch((err) => {
  console.error('Fatal error during PDF generation:', err);
  process.exit(1);
});
