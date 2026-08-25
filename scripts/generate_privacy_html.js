#!/usr/bin/env node
/**
 * Render PRIVACY_POLICY.md into convex/privacyPolicyHtml.ts.
 *
 * The policy is published in four places — this hosted page (which the App
 * Store and Play listings link to), the markdown, the PDF, and the in-app
 * modal. They drifted badly: the hosted page sat at February 2026 while the
 * document moved on, so the public policy said nothing about advertising.
 *
 * Generating this one from the markdown removes a copy from that list.
 * Run after any edit to PRIVACY_POLICY.md:
 *
 *   node scripts/generate_privacy_html.js && npx convex deploy
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const md = fs.readFileSync(path.join(ROOT, 'PRIVACY_POLICY.md'), 'utf8');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Inline markdown: bold, links, backticks. Escaping happens first. */
const inline = (s) =>
  escapeHtml(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const lines = md.split('\n');
const out = [];
let inList = false;
let para = [];
// List items buffer their RAW text: bold can span a wrapped line, and inline()
// must see both halves at once or the markers pair up with the wrong partner.
let item = [];

const flushItem = () => {
  if (item.length) {
    out.push(`<li>${inline(item.join(' '))}</li>`);
    item = [];
  }
};
const flushPara = () => {
  if (para.length) {
    out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  }
};
const closeList = () => {
  flushItem();
  if (inList) {
    out.push('</ul>');
    inList = false;
  }
};

let title = 'Privacy Policy';
let dateLine = '';

for (const raw of lines) {
  const line = raw.trimEnd();

  if (/^#\s+/.test(line)) {
    flushPara(); closeList();
    title = line.replace(/^#\s+/, '');
    continue;
  }
  // The two metadata lines become the subtitle rather than body copy.
  if (/^\*\*(Last updated|Effective date):\*\*/.test(line)) {
    flushPara(); closeList();
    dateLine += (dateLine ? ' &middot; ' : '') + inline(line).replace(/<\/?strong>/g, '');
    continue;
  }
  if (/^##\s+/.test(line)) {
    flushPara(); closeList();
    out.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`);
    continue;
  }
  if (/^---+$/.test(line)) {
    flushPara(); closeList();
    continue; // headings already separate sections
  }
  if (/^[-*]\s+/.test(line)) {
    flushPara();
    flushItem();
    if (!inList) { out.push('<ul>'); inList = true; }
    item.push(line.replace(/^[-*]\s+/, ''));
    continue;
  }
  if (line === '') {
    flushPara(); closeList();
    continue;
  }
  // Wrapped continuation of the current list item.
  if (inList && /^\s{2,}\S/.test(raw)) {
    item.push(line.trim());
    continue;
  }
  closeList();
  para.push(line.trim());
}
flushPara(); closeList();

const body = out.join('\n    ');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bump Match - Privacy Policy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.7; background: #fafafa; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #111; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 20px; margin-top: 32px; margin-bottom: 12px; color: #222; }
    p, li { font-size: 16px; color: #444; margin-bottom: 12px; }
    ul { padding-left: 24px; margin-bottom: 16px; }
    a { color: #E96D89; }
    code { font-family: ui-monospace, Menlo, monospace; font-size: 14px; background: #f0ece9; padding: 1px 5px; border-radius: 4px; }
    strong { color: #222; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title.replace(/^Bump Match — /, ''))}</h1>
    <p class="date">${dateLine}</p>

    ${body}
  </div>
</body>
</html>`;

const target = path.join(ROOT, 'convex', 'privacyPolicyHtml.ts');
fs.writeFileSync(
  target,
  `// GENERATED FILE — do not edit by hand.\n` +
  `// Source: PRIVACY_POLICY.md\n` +
  `// Regenerate: node scripts/generate_privacy_html.js\n\n` +
  `export const PRIVACY_POLICY_HTML = ${JSON.stringify(html)};\n`,
);

console.log(`Wrote ${path.relative(ROOT, target)} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`Title: ${title}`);
console.log(`Date:  ${dateLine.replace(/&middot;/g, '·')}`);
