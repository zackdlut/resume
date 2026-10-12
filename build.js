#!/usr/bin/env node
// 用法：node build.js [resume.md] [--pdf]
// 只支持简历用到的 Markdown 子集：# / ## / ### 标题、- 列表（两级）、整行 *说明*、
// **加粗**、[链接](url)、![照片](文件)、<!-- 注释 -->。
// "# 姓名" 之后、第一个 "##" 之前的 "键：值" 行渲染为基础信息栏。

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const wantPdf = args.includes('--pdf');
const input = path.resolve(args.find((a) => !a.startsWith('--')) || 'resume.md');
const base = input.replace(/\.md$/, '');
const htmlOut = `${base}.html`;
const pdfOut = `${base}.pdf`;

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const inline = (s) =>
  escapeHtml(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/【[^】]*】/g, '<span class="todo">$&</span>');

// 求职意向超过两项时，在最后一项前换行，避免在 "C/C++" 这类词中间断开。
const wrapIntent = (s) => {
  const html = inline(s);
  if ((html.match(/、/g) || []).length < 2) return html;
  const i = html.lastIndexOf('、');
  return `${html.slice(0, i + 1)}<br>${html.slice(i + 1)}`;
};

const SEP = /\s*｜\s*/;

const sectionKind = (title) => {
  if (/工作/.test(title)) return 'timeline rows rows-date';
  if (/项目/.test(title)) return 'timeline rows rows-meta';
  if (/技能/.test(title)) return 'rows rows-skill';
  if (/优势|专利|证书/.test(title)) return 'rows rows-meta';
  if (/教育/.test(title)) return 'flat';
  return '';
};

const sectionTitle = (title) =>
  `<h2>${inline(title)}</h2>`;

function renderHeader(name, lines, mdDir) {
  const kv = [];
  let intent = '';
  let photo = '';
  const extra = [];
  for (const line of lines) {
    let m;
    if ((m = line.match(/^!\[[^\]]*\]\(([^)]+)\)$/))) {
      if (fs.existsSync(path.resolve(mdDir, m[1]))) photo = m[1];
    } else if ((m = line.match(/^([^：:]{1,6})[：:]\s*(.*)$/))) {
      if (/求职意向/.test(m[1])) intent = m[2];
      else kv.push([m[1].trim(), m[2]]);
    } else {
      extra.push(line);
    }
  }
  return (
    '<header class="basic">' +
    '<div class="who">' +
    `<h1>${inline(name)}</h1>` +
    (intent ? `<p class="intent">求职意向：${wrapIntent(intent)}</p>` : '') +
    '</div>' +
    '<div class="kv">' +
    kv
      .map(([k, v]) => `<p><span class="k">${inline(k)}</span><span class="colon">：</span><span class="v">${inline(v)}</span></p>`)
      .join('') +
    extra.map((l) => `<p>${inline(l)}</p>`).join('') +
    '</div>' +
    (photo ? `<img class="photo" src="${escapeHtml(photo)}" alt="照片">` : '') +
    '</header>'
  );
}

function render(md, mdDir) {
  const lines = md.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const out = [];
  let listDepth = 0;
  let header = null;
  let section = '';
  let inSection = false;

  const closeLists = (to = 0) => {
    while (listDepth > to) {
      out.push('</li></ul>');
      listDepth--;
    }
  };
  const flushHeader = () => {
    if (header) out.push(renderHeader(header.name, header.lines, mdDir));
    header = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;

    let m;
    if ((m = line.match(/^# (.*)$/))) {
      header = { name: m[1], lines: [] };
      continue;
    }
    if (header && !line.startsWith('## ')) {
      header.lines.push(line.trim());
      continue;
    }

    const item = line.match(/^(\s*)- (.*)$/);
    if (item) {
      const depth = item[1].length >= 2 ? 2 : 1;
      if (depth > listDepth) {
        while (listDepth < depth) {
          out.push(listDepth === 0 ? '<ul>' : '<ul class="sub">');
          listDepth++;
        }
      } else {
        closeLists(depth);
        out.push('</li>');
      }
      const body = inline(item[2]);
      const row = body.match(/^<strong>([^<]+)<\/strong>(?:[：:]\s*|｜)([\s\S]*)$/);
      // 只把短标签放进固定列。年份单独放行，长标签保持普通一行，避免逐字竖排。
      const useRow = row && ([...row[1]].length <= 6 || /^\d{4}/.test(row[1]));
      out.push(
        useRow
          ? `<li class="row"><span class="lbl">${row[1]}</span><span class="val">${row[2]}</span>`
          : `<li>${body}`
      );
      continue;
    }
    closeLists();

    if ((m = line.match(/^## (.*)$/))) {
      flushHeader();
      if (inSection) out.push('</section>');
      section = m[1];
      out.push(sectionTitle(section));
      out.push(`<section class="sec ${sectionKind(section)}">`);
      inSection = true;
    } else if ((m = line.match(/^### (.*)$/))) {
      const parts = m[1].split(SEP);
      const date = parts.length > 1 ? parts.pop() : '';
      const [title, ...rest] = parts;
      out.push(
        '<div class="entry">' +
          `<span class="title">${inline(title)}` +
          rest.map((r) => `<span class="role">${inline(r)}</span>`).join('') +
          '</span>' +
          `<span class="date">${inline(date)}</span>` +
          '</div>'
      );
    } else if ((m = line.match(/^\*([^*].*[^*])\*$/))) {
      out.push(`<p class="desc">${inline(m[1])}</p>`);
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeLists();
  flushHeader();
  if (inSection) out.push('</section>');
  return out.join('\n');
}

const CSS = `
@page { size: A4; margin: 11mm 14mm 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  /* 色调对齐 zhangheng.pdf（Word 大工模板蓝 #4F81BD） */
  --ink: #1a1a1a;
  --accent: #4f81bd;
  --strong: #4f81bd;
  --sky: #4f81bd;
  --rail: #c5d0dc;
  --mist: #d6dfe7;
  --muted: #666;
  --faint: #a6a6a6;
  --num: Bahnschrift, "DIN Alternate", "Roboto Condensed", "Segoe UI", sans-serif;
}
html { background: #ececec; }
body {
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  font-size: 10.5pt; line-height: 1.4; color: var(--ink);
  width: 210mm; min-height: 297mm; margin: 24px auto; padding: 12mm 14mm;
  background: #fff; box-shadow: 0 2px 16px rgba(0, 0, 0, .12);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
@media print {
  @page { size: A4; margin: 8mm 11mm 7mm; }
  html { background: none; }
  body {
    width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none;
    font-size: 9.25pt; line-height: 1.28;
  }
  header.basic { gap: 14px; padding-bottom: 4px; }
  .who h1 { font-size: 19pt; letter-spacing: 4px; }
  .intent { margin-top: 3px; }
  .kv { padding-left: 14px; }
  .kv p { line-height: 1.32; }
  .photo { width: 20mm; height: 26mm; }
  h2 { font-size: 9.5pt; padding: 1px 8px; margin: 3px 0 1px; letter-spacing: 1px; }
  li { break-inside: auto; }
  .entry { margin-top: 2px; }
  li.row { column-gap: 8px; }
  .timeline { margin-left: 2px; padding-left: 12px; }
  .timeline .entry::before { width: 7px; height: 7px; left: -17px; }
  .desc { margin-top: 0; }
}
a { color: inherit; text-decoration: none; white-space: nowrap; }
strong { font-weight: 700; }
em { font-style: normal; }
.todo { color: var(--faint); font-weight: 400; }

header.basic {
  display: flex; align-items: center; gap: 22px;
  padding: 2px 0 6px 2px; border-bottom: 1.5px solid var(--accent);
}
.who { flex: 1 1 auto; min-width: 0; }
.who h1 { font-size: 22pt; letter-spacing: 6px; line-height: 1.25; }
.intent { margin-top: 6px; color: var(--ink); font-weight: 700; }
.kv { flex: 0 0 auto; border-left: 1px solid var(--rail); padding-left: 20px; }
.kv p { line-height: 1.45; }
.kv .k { display: inline-block; width: 4em; text-align-last: justify; color: var(--muted); }
.kv .colon { color: var(--muted); }
.kv .v { font-family: var(--num); white-space: nowrap; }
.photo {
  flex: none; width: 23mm; height: 30mm; object-fit: cover; object-position: center 35%;
  border-radius: 4px;
}

h2 {
  font-size: 11pt; font-weight: 700; letter-spacing: 2px;
  color: #fff; background: var(--accent);
  padding: 3px 10px; margin: 8px 0 4px; break-after: avoid;
}

ul { padding-left: 1.15em; }
li { break-inside: avoid; }
.rows > ul, .timeline > ul, .flat > ul { list-style: none; padding-left: 0; }
.rows li:not(.row) { list-style: disc; margin-left: 1.15em; }
li.row {
  display: grid;
  grid-template-columns: var(--lbl, 4.6em) minmax(0, 1fr);
  column-gap: 12px;
  align-items: baseline;
}
.rows { --lbl: 6.6em; }
.lbl { font-weight: 700; white-space: nowrap; }
.rows-date .lbl { font-family: var(--num); font-weight: 600; }
li.row > ul { grid-column: 1 / -1; padding-top: 1px; }
.val { min-width: 0; }

.flat ul { padding-left: 0; }

.timeline { margin-left: 4px; padding-left: 14px; border-left: 1px solid var(--rail); }
.timeline ul { padding-left: 0; }
.entry {
  position: relative; display: flex; align-items: baseline; gap: 12px;
  margin-top: 4px; break-after: avoid;
}
.timeline > .entry:first-child { margin-top: 1px; }
.timeline .entry::before {
  content: ""; position: absolute; left: -18.5px; top: .45em;
  width: 8px; height: 8px; border-radius: 50%; background: #fff; border: 1.5px solid var(--accent);
}
.timeline .entry:first-of-type::before { background: var(--accent); border-color: var(--accent); }
.entry .title { flex: 1; font-weight: 700; }
.entry .role { font-weight: 400; color: var(--muted); }
.entry .role::before { content: "·"; margin: 0 8px; color: var(--faint); }
.entry .date {
  flex: none; white-space: nowrap;
  font-family: var(--num); color: var(--strong);
}
.desc { color: var(--muted); break-after: avoid; }
`;

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

const toBrowserPath = (exe, p) =>
  exe.startsWith('/mnt/') ? execFileSync('wslpath', ['-w', p]).toString().trim() : p;

const md = fs.readFileSync(input, 'utf8');
const name = (md.match(/^# (.*)$/m) || [, '简历'])[1].trim();
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(name)} - 简历</title>
<style>${CSS}</style>
</head>
<body>
${render(md, path.dirname(input))}
</body>
</html>
`;
fs.writeFileSync(htmlOut, html);
console.log(`已生成 ${path.relative(process.cwd(), htmlOut)}`);

if (wantPdf) {
  const chrome = findChrome();
  if (!chrome) {
    console.error('未找到 Chrome/Edge，请用浏览器打开 HTML 后"打印 → 另存为 PDF"，或设置 CHROME 环境变量。');
    process.exit(1);
  }
  const src = toBrowserPath(chrome, htmlOut);
  const url = src.startsWith('/') ? `file://${src}` : `file:///${src.replace(/\\/g, '/')}`;
  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${toBrowserPath(chrome, pdfOut)}`,
    url,
  ], { stdio: 'ignore' });
  console.log(`已生成 ${path.relative(process.cwd(), pdfOut)}`);
}
