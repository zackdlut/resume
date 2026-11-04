const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { marked } = require('marked');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DOCUMENT_CSS = `
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
html { background: #e8e8e8; }
body {
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: 11pt; line-height: 1.65; color: #1a1a1a;
  max-width: 210mm; margin: 24px auto; padding: 16mm 18mm;
  background: #fff; box-shadow: 0 2px 16px rgba(0,0,0,.1);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
@media print {
  html { background: none; }
  body { max-width: none; margin: 0; padding: 0; box-shadow: none; }
}
h1 { font-size: 1.75em; margin: 0 0 .6em; border-bottom: 2px solid #4f81bd; padding-bottom: .25em; }
h2 { font-size: 1.25em; margin: 1.2em 0 .5em; color: #4f81bd; }
h3 { font-size: 1.05em; margin: 1em 0 .4em; }
p { margin: .45em 0; }
ul, ol { margin: .4em 0; padding-left: 1.5em; }
li { margin: .2em 0; }
blockquote {
  margin: .8em 0; padding: .4em 1em; border-left: 4px solid #c5d0dc; color: #444; background: #f7f9fb;
}
pre, code { font-family: ui-monospace, "Cascadia Code", Consolas, monospace; font-size: .9em; }
pre {
  overflow-x: auto; padding: .75em 1em; background: #f4f4f4; border-radius: 4px;
  border: 1px solid #e0e0e0;
}
code { background: #f0f0f0; padding: .1em .35em; border-radius: 3px; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: .8em 0; font-size: .95em; }
th, td { border: 1px solid #ccc; padding: .35em .6em; text-align: left; }
th { background: #eef3f9; }
img { max-width: 100%; height: auto; }
a { color: #2563eb; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
`;

function configureMarked(baseDir) {
  marked.use({
    gfm: true,
    breaks: false,
  });
  const renderer = new marked.Renderer();
  const defaultImage = renderer.image.bind(renderer);
  renderer.image = (href, title, text) => {
    let src = href || '';
    if (src && !/^([a-z]+:|\/\/|data:)/i.test(src)) {
      src = path.resolve(baseDir, src);
    }
    return defaultImage(src, title, text);
  };
  marked.setOptions({ renderer });
}

function stripFrontMatter(md) {
  if (md.startsWith('---')) {
    const end = md.indexOf('\n---', 3);
    if (end !== -1) return md.slice(end + 4).replace(/^\n/, '');
  }
  return md;
}

function markdownToBodyHtml(md, baseDir) {
  configureMarked(baseDir);
  let text = md.replace(/<!--[\s\S]*?-->/g, '');
  text = stripFrontMatter(text);
  return marked.parse(text);
}

function wrapHtmlDocument(title, bodyHtml) {
  const safeTitle = escapeHtml(title || '文档');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>${DOCUMENT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function titleFromMarkdown(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  const first = md.replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n/).find((l) => l.trim());
  if (first) return first.slice(0, 40);
  return fallback || '文档';
}

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

const toBrowserPath = (exe, p) =>
  exe.startsWith('/mnt/') ? execFileSync('wslpath', ['-w', p]).toString().trim() : p;

function exportPdf(htmlPath, pdfPath) {
  const chrome = findChrome();
  if (!chrome) {
    throw new Error(
      '未找到 Chrome/Edge。请用浏览器打开 HTML 后「打印 → 另存为 PDF」，或设置 CHROME 环境变量。'
    );
  }
  const absHtml = path.resolve(htmlPath);
  const absPdf = path.resolve(pdfPath);
  const src = toBrowserPath(chrome, absHtml);
  const url = src.startsWith('/') ? `file://${src}` : `file:///${src.replace(/\\/g, '/')}`;
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${toBrowserPath(chrome, absPdf)}`,
      url,
    ],
    { stdio: 'ignore' }
  );
}

async function exportDocx(html, outPath) {
  const HTMLtoDOCX = require('html-to-docx');
  const buffer = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    header: false,
    font: 'Microsoft YaHei',
    fontSize: 22,
  });
  fs.writeFileSync(outPath, buffer);
}

function findPandoc() {
  try {
    execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
    return 'pandoc';
  } catch {
    return null;
  }
}

function exportDocxViaPandoc(mdPath, docxPath) {
  execFileSync('pandoc', [path.resolve(mdPath), '-o', path.resolve(docxPath)], { stdio: 'inherit' });
}

/** 将 HTML 内相对路径图片嵌入为 data URL，便于 Word 导出 */
function embedImagesInHtml(html, baseDir) {
  return html.replace(/<img([^>]*)\ssrc="([^"]+)"/gi, (match, attrs, src) => {
    if (/^(data:|https?:|file:)/i.test(src)) return match;
    const abs = path.resolve(baseDir, decodeURIComponent(src));
    if (!fs.existsSync(abs)) return match;
    const ext = path.extname(abs).slice(1).toLowerCase();
    const mime =
      { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[
        ext
      ] || 'application/octet-stream';
    const b64 = fs.readFileSync(abs).toString('base64');
    return `<img${attrs} src="data:${mime};base64,${b64}"`;
  });
}

module.exports = {
  DOCUMENT_CSS,
  escapeHtml,
  markdownToBodyHtml,
  wrapHtmlDocument,
  titleFromMarkdown,
  exportPdf,
  exportDocx,
  exportDocxViaPandoc,
  findPandoc,
  embedImagesInHtml,
};
