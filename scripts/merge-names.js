#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ssa = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'ssa-popular-names.json'), 'utf8'));
const celeb = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'celebrity-names.json'), 'utf8'));
const babyNamesPath = path.join(__dirname, '..', 'src', 'data', 'babyNames.ts');
let src = fs.readFileSync(babyNamesPath, 'utf8');

// Parse existing names to find dupes
const existingNames = new Map(); // lowercase name -> id
const nameRegex = /\{\s*id:\s*'(\d+)',\s*name:\s*'([^']+)'/g;
let m;
while ((m = nameRegex.exec(src)) !== null) {
  existingNames.set(m[2].toLowerCase(), m[1]);
}

// Find the highest existing ID
let maxId = 0;
for (const id of existingNames.values()) {
  const n = parseInt(id);
  if (n > maxId) maxId = n;
}

// For SSA dupes: add yearRank and popularity to existing entries
const ssaDupeMap = new Map();
for (const entry of ssa) {
  if (existingNames.has(entry.name.toLowerCase())) {
    ssaDupeMap.set(entry.name.toLowerCase(), entry);
  }
}

// Update existing entries that match SSA names - add popularity and yearRank
for (const [nameLower, ssaEntry] of ssaDupeMap) {
  // Find the entry in source and add yearRank
  const pattern = new RegExp(
    `(\\{[^}]*name:\\s*'${ssaEntry.name}'[^}]*)\\}`,
    'g'
  );
  src = src.replace(pattern, (match, inner) => {
    // Add popularity if not present
    if (!inner.includes('popularity')) {
      inner += `, popularity: 'popular'`;
    }
    // Add yearRank
    if (!inner.includes('yearRank')) {
      inner += `, yearRank: ${ssaEntry.yearRank}`;
    }
    return inner + ' }';
  });
}

// For celeb dupes: add celebrity tag
for (const entry of celeb) {
  if (existingNames.has(entry.name.toLowerCase())) {
    const pattern = new RegExp(
      `(\\{[^}]*name:\\s*'${entry.name}'[^}]*)\\}`,
      'g'
    );
    src = src.replace(pattern, (match, inner) => {
      if (!inner.includes('celebrity')) {
        inner += `, celebrity: '${entry.celebrity.replace(/'/g, "\\'")}'`;
      }
      return inner + ' }';
    });
  }
}

// Build new SSA entries (non-dupes)
const newSSA = ssa.filter(x => !existingNames.has(x.name.toLowerCase()));
const newCeleb = celeb.filter(x => !existingNames.has(x.name.toLowerCase()));

// Also dedupe celebrity against new SSA
const newSSANames = new Set(newSSA.map(x => x.name.toLowerCase()));

let nextId = maxId + 1;
const newEntries = [];

// Add new SSA names
for (const entry of newSSA) {
  newEntries.push(
    `  { id: '${nextId}', name: '${entry.name}', gender: '${entry.gender}', origin: '${entry.origin}', meaning: '${entry.meaning.replace(/'/g, "\\'")}', language: 'English', popularity: 'popular', yearRank: ${entry.yearRank} }`
  );
  nextId++;
}

// Add new celebrity names
for (const entry of newCeleb) {
  // Skip if already added via SSA
  if (newSSANames.has(entry.name.toLowerCase())) continue;
  newEntries.push(
    `  { id: '${nextId}', name: '${entry.name}', gender: '${entry.gender}', origin: '${entry.origin.replace(/'/g, "\\'")}', meaning: '${entry.meaning.replace(/'/g, "\\'")}', language: 'English', celebrity: '${entry.celebrity.replace(/'/g, "\\'")}' }`
  );
  nextId++;
}

// Insert new entries before the closing ];
const insertPoint = src.lastIndexOf('];');
const newBlock = '\n  // SSA Popular Names 2023 & Celebrity Baby Names\n' + newEntries.join(',\n') + ',\n';
src = src.slice(0, insertPoint) + newBlock + src.slice(insertPoint);

fs.writeFileSync(babyNamesPath, src);
console.log(`Updated ${ssaDupeMap.size} existing SSA dupes with yearRank`);
console.log(`Added ${newSSA.length} new SSA names`);
console.log(`Added ${newCeleb.filter(x => !newSSANames.has(x.name.toLowerCase())).length} new celebrity names`);
console.log(`Total new entries: ${newEntries.length}`);
console.log(`New max ID: ${nextId - 1}`);
