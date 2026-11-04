#!/usr/bin/env node
/**
 * Markdown → HTML / PDF / Word
 *
 * 用法：
 *   node md-convert.js 文档.md              # 生成 文档.html
 *   node md-convert.js 文档.md --pdf        # 再导出 PDF（需 Chrome/Edge）
 *   node md-convert.js 文档.md --docx       # 再导出 Word (.docx)
 *   node md-convert.js 文档.md --pdf --docx --out=报告
 *   node md-convert.js --serve              # 打开本地转换网页 http://127.0.0.1:8765
 *
 * 简历（与 build.js 相同排版）：
 *   node build.js resume.embedding.md --pdf --docx
 *   node md-convert.js resume.embedding.md --resume --pdf --docx
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const {
  markdownToBodyHtml,
  wrapHtmlDocument,
  titleFromMarkdown,
  exportPdf,
  exportDocx,
  exportDocxViaPandoc,
  findPandoc,
  embedImagesInHtml,
} = require('./md-convert-lib');
const { buildResume } = require('./build.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function usage() {
  console.log(`Markdown 转换工具

  node md-convert.js <file.md> [选项]
  node md-convert.js --serve [--port=8765]

选项：
  --html        生成 HTML（默认开启）
  --pdf         生成 PDF（Headless Chrome）
  --docx        生成 Word（html-to-docx；若已安装 pandoc 则优先用 pandoc）
  --out=basename  输出文件名（不含扩展名），默认与 .md 同名
  --resume        使用 build.js 简历排版（PDF/Word 版式与 resume.embedding.pdf 一致）
  --theme=classic 配合 --resume：Word 大工模板风格
  --serve       启动本地网页
  --port=8765   本地服务端口
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes('-h') || args.includes('--help')) {
    usage();
    process.exit(args.length ? 0 : 1);
  }
  const wantServe = args.includes('--serve');
  const wantResume = args.includes('--resume');
  const wantPdf = args.includes('--pdf');
  const wantDocx = args.includes('--docx');
  const wantHtml = args.includes('--html') || (!wantPdf && !wantDocx && !wantServe);
  const opt = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
  const port = parseInt(opt('port') || '8765', 10);
  const input = args.find((a) => !a.startsWith('--'));
  return {
    input,
    wantServe,
    wantResume,
    wantPdf,
    wantDocx,
    wantHtml,
    port,
    outBase: opt('out'),
    theme: opt('theme') || 'default',
  };
}

function resolveOutBase(input, outOpt) {
  if (outOpt) return path.resolve(outOpt.replace(/\.(html|pdf|docx)$/i, ''));
  return input.replace(/\.md$/i, '');
}

async function convertFile(inputPath, options) {
  const input = path.resolve(inputPath);
  if (!fs.existsSync(input)) {
    console.error(`找不到文件：${input}`);
    process.exit(1);
  }
  const md = fs.readFileSync(input, 'utf8');
  const baseDir = path.dirname(input);
  const outBase = resolveOutBase(input, options.outBase);
  const title = titleFromMarkdown(md, path.basename(input, '.md'));
  const bodyHtml = markdownToBodyHtml(md, baseDir);
  const fullHtml = wrapHtmlDocument(title, bodyHtml);

  if (options.wantHtml) {
    const htmlOut = `${outBase}.html`;
    fs.writeFileSync(htmlOut, fullHtml);
    console.log(`已生成 ${path.relative(process.cwd(), htmlOut)}`);
  }

  const htmlOut = `${outBase}.html`;
  if (!options.wantHtml) {
    fs.writeFileSync(htmlOut, fullHtml);
  }

  if (options.wantPdf) {
    const pdfOut = `${outBase}.pdf`;
    try {
      exportPdf(htmlOut, pdfOut);
      console.log(`已生成 ${path.relative(process.cwd(), pdfOut)}`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }

  if (options.wantDocx) {
    const docxOut = `${outBase}.docx`;
    const pandoc = findPandoc();
    if (pandoc) {
      exportDocxViaPandoc(input, docxOut);
      console.log(`已生成 ${path.relative(process.cwd(), docxOut)}（pandoc）`);
    } else {
      await exportDocx(fullHtml, docxOut);
      console.log(`已生成 ${path.relative(process.cwd(), docxOut)}`);
    }
  }

  if (!options.wantHtml && !options.wantPdf && !options.wantDocx) {
    fs.unlinkSync(htmlOut);
  }
}

async function convertResumeFile(inputPath, options) {
  await buildResume({
    input: path.resolve(inputPath),
    pdf: options.wantPdf,
    docx: options.wantDocx,
    theme: options.theme,
    outBase: options.outBase,
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function handleResumeApi(req, res) {
  try {
    const body = await readJsonBody(req);
    const md = body.md;
    if (!md || typeof md !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少 md 字段' }));
      return;
    }
    const theme = body.theme === 'classic' ? 'classic' : 'default';
    const wantPdf = body.formats?.includes('pdf');
    const wantDocx = body.formats?.includes('docx');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-build-'));
    const mdPath = path.join(tmpDir, body.filename || 'resume.md');
    fs.writeFileSync(mdPath, md);
    const assets = ['dut-logo.png', 'avatar.jpg'];
    const root = path.dirname(__filename);
    for (const name of assets) {
      const src = path.join(root, name);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmpDir, name));
    }
    const outBase = path.join(tmpDir, 'out');
    const result = await buildResume({
      input: mdPath,
      pdf: wantPdf,
      docx: wantDocx,
      theme,
      outBase,
    });
    const payload = { html: result.html, name: result.name };
    if (wantPdf && fs.existsSync(result.pdfOut)) {
      payload.pdfBase64 = fs.readFileSync(result.pdfOut).toString('base64');
    }
    if (wantDocx && fs.existsSync(result.docxOut)) {
      payload.docxBase64 = fs.readFileSync(result.docxOut).toString('base64');
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
}

function startServer(port) {
  const root = path.dirname(__filename);
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/resume/build') {
      handleResumeApi(req, res);
      return;
    }
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/md-convert.html';
    const filePath = path.normalize(path.join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`本地转换页：http://127.0.0.1:${port}/`);
    console.log('简历排版：在页面选择「简历模式」，或命令行 node build.js resume.embedding.md --pdf --docx');
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.wantServe) {
    startServer(opts.port);
    return;
  }
  if (!opts.input) {
    usage();
    process.exit(1);
  }
  if (opts.wantResume) {
    await convertResumeFile(opts.input, {
      wantPdf: opts.wantPdf,
      wantDocx: opts.wantDocx,
      theme: opts.theme,
      outBase: opts.outBase ? resolveOutBase(opts.input, opts.outBase) : undefined,
    });
    return;
  }
  await convertFile(opts.input, {
    wantHtml: opts.wantHtml,
    wantPdf: opts.wantPdf,
    wantDocx: opts.wantDocx,
    outBase: opts.outBase ? resolveOutBase(opts.input, opts.outBase) : undefined,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
