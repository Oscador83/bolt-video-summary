// Build a self-contained HTML document for a summary (or a list of summaries).
// No external assets; image inlined as base64. Opens in any browser; print-to-PDF clean.

import type { Card } from "./session-store";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Minimal Markdown → HTML renderer. Covers headings, lists, bold/italic,
// inline code, links and paragraphs — enough for the summaries we generate.
function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushLists = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushLists(); continue; }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); flushLists();
      const lvl = Math.min(6, h[1].length + 1);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }

    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    flushLists();
    para.push(line);
  }
  flushPara(); flushLists();
  return out.join("\n");
}

function inline(s: string): string {
  let r = esc(s);
  // links [text](url)
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => `<a href="${u}">${t}</a>`);
  // bold **x** then italic *x*
  r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // inline code `x`
  r = r.replace(/`([^`]+)`/g, "<code>$1</code>");
  return r;
}

const STYLES = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 2rem auto; padding: 0 1.25rem; color: #1f2937; line-height: 1.6; }
header { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
header h1 { margin: 0 0 .25rem; font-size: 1.4rem; }
header .meta { color: #6b7280; font-size: .85rem; }
header a { color: #2563eb; }
h2 { margin-top: 2rem; font-size: 1.15rem; }
h3 { margin-top: 1.25rem; font-size: 1rem; }
ul, ol { padding-left: 1.5rem; }
li { margin: .25rem 0; }
img.visual { display: block; max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: .5rem; margin: 1.25rem 0; }
hr { border: 0; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: .75rem; text-align: center; }
footer .brand { letter-spacing: .15em; text-transform: uppercase; font-weight: 600; }
footer .brand .gold { color: #b08a3c; }
@media print { body { margin: .5rem auto; } }
`;

function cardHtml(card: Card): string {
  const ytUrl = card.videoId ? `https://www.youtube.com/watch?v=${card.videoId}` : null;
  const body = card.translated?.content ?? card.text ?? "";
  return `
<section>
  <h2>${esc(card.title ?? "YouTube video")}</h2>
  <p class="meta">${esc(card.author ?? "")}${card.author ? " · " : ""}${
    ytUrl ? `<a href="${ytUrl}">${ytUrl}</a>` : ""
  }</p>
  ${mdToHtml(body)}
  ${card.visualSrc ? `<img class="visual" src="${card.visualSrc}" alt="Visual summary">` : ""}
</section>
`.trim();
}

export function buildHtmlDoc(opts: {
  title: string;
  cards: Card[];
  globalSummary?: string | null;
  globalImage?: string | null;
  textModelLabel: string;
  imageModelLabel: string;
}): string {
  const date = new Date().toLocaleString();
  const cardsHtml = opts.cards.map(cardHtml).join("\n<hr>\n");
  const globalHtml = opts.globalSummary
    ? `
<hr>
<section>
  <h2>Global summary</h2>
  ${mdToHtml(opts.globalSummary)}
  ${opts.globalImage ? `<img class="visual" src="${opts.globalImage}" alt="Global visual summary">` : ""}
</section>`.trim()
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(opts.title)}</title>
<style>${STYLES}</style>
</head>
<body>
<header>
  <h1>${esc(opts.title)}</h1>
  <div class="meta">Generated ${esc(date)} · Text model: ${esc(opts.textModelLabel)} · Image model: ${esc(opts.imageModelLabel)}</div>
</header>
${cardsHtml}
${globalHtml}
<footer>
  <div class="brand"><span class="gold">OS</span>VidSum</div>
</footer>
</body>
</html>`;
}
