#!/usr/bin/env node
// Merge a generated-names JSON file into src/data/babyNames.ts.
//
// Usage: node scripts/merge-generated-names.js <generated.json>
//   generated.json shape: { "<language>": [ { name, gender, origin, meaning,
//   popularity?, yearRank? }, ... ], ... }
//
// Dedupes case-insensitively per language against the existing catalogue and
// within the input, assigns sequential ids after the current max, and inserts
// before the END_RAW_DATA sentinel. Run `npx tsc --noEmit` after merging.

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/merge-generated-names.js <generated.json>');
  process.exit(1);
}

const babyNamesPath = path.join(__dirname, '..', 'src', 'data', 'babyNames.ts');
let src = fs.readFileSync(babyNamesPath, 'utf8');
const generated = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Existing entries: (language, lowercased name) pairs + max numeric id
const entryRe = /\{\s*id:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*gender:\s*'([^']+)',\s*origin:\s*'((?:[^'\\]|\\.)*)',\s*meaning:\s*'((?:[^'\\]|\\.)*)',\s*language:\s*'([^']+)'/g;
const existingByLang = new Map();
let maxId = 0;
let m;
while ((m = entryRe.exec(src))) {
  const id = parseInt(m[1], 10);
  if (!Number.isNaN(id)) maxId = Math.max(maxId, id);
  const lang = m[6];
  if (!existingByLang.has(lang)) existingByLang.set(lang, new Set());
  existingByLang.get(lang).add(m[2].replace(/\\'/g, "'").toLowerCase());
}
console.log(`Existing catalogue: max id ${maxId}, ${existingByLang.size} languages`);

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").trim();
const VALID_GENDERS = new Set(['boy', 'girl', 'unisex']);

let nextId = maxId + 1;
const lines = [];
const stats = {};

for (const [lang, entries] of Object.entries(generated)) {
  const seen = existingByLang.get(lang) || new Set();
  let added = 0;
  let skipped = 0;
  for (const e of entries || []) {
    const name = String(e.name || '').trim();
    const key = name.toLowerCase();
    if (
      !name ||
      name.length > 40 ||
      !VALID_GENDERS.has(e.gender) ||
      !e.meaning ||
      String(e.meaning).length > 90 ||
      seen.has(key)
    ) {
      skipped++;
      continue;
    }
    seen.add(key);
    const extras =
      (e.popularity === 'popular' ? `, popularity: 'popular'` : '') +
      (Number.isInteger(e.yearRank) && e.yearRank > 0 ? `, yearRank: ${e.yearRank}` : '');
    lines.push(
      `  { id: '${nextId}', name: '${esc(name)}', gender: '${e.gender}', origin: '${esc(e.origin || lang)}', meaning: '${esc(e.meaning)}', language: '${esc(lang)}'${extras} },`
    );
    nextId++;
    added++;
  }
  stats[lang] = { added, skipped };
}

const sentinel = '// <<END_RAW_DATA>>';
const insertPoint = src.indexOf(sentinel);
if (insertPoint === -1) {
  throw new Error('END_RAW_DATA sentinel not found in babyNames.ts — aborting');
}
const block = `  // --- Expanded catalogue (generated + verified, July 2026) ---\n${lines.join('\n')}\n  `;
src = src.slice(0, insertPoint) + block + src.slice(insertPoint);

// Refresh the stale header count comment
const total = maxId + lines.length;
src = src.replace(/\/\/ Raw dataset:.*\n/, `// Raw dataset: ${total} names across 19 languages.\n`);

fs.writeFileSync(babyNamesPath, src);
console.log(`Inserted ${lines.length} new names (ids ${maxId + 1}–${nextId - 1}); total now ${total}`);
for (const [lang, s] of Object.entries(stats)) {
  console.log(`  ${lang}: +${s.added} (${s.skipped} skipped)`);
}
