#!/usr/bin/env node

/**
 * fetch-ssa-names.js
 *
 * Uses the SSA top baby names (2023 data - most recent published) hardcoded
 * since SSA blocks automated downloads. Enriches each name with meaning/origin
 * from Wikipedia API and writes to scripts/output/ssa-popular-names.json.
 *
 * Usage:  node scripts/fetch-ssa-names.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// SSA Top 100 Baby Names 2023 (source: ssa.gov/oact/babynames)
const SSA_BOYS = [
  'Liam','Noah','Oliver','James','Elijah','Theodore','Henry','Lucas','William','Benjamin',
  'Jack','Levi','Alexander','Jackson','Daniel','Michael','Mason','Sebastian','Ethan','Logan',
  'Owen','Samuel','Jacob','Asher','Aiden','John','Joseph','Wyatt','David','Leo',
  'Luke','Julian','Hudson','Grayson','Matthew','Ezra','Gabriel','Carter','Jayden','Luca',
  'Maverick','Josiah','Isaac','Lincoln','Caleb','Brooks','Austin','Nathan','Miles','Elias',
  'Christian','Andrew','Thomas','Joshua','Ezekiel','Jaxon','Nolan','Adrian','Cameron','Santiago',
  'Jameson','Aaron','Connor','Cooper','Ian','Dominic','Colton','Kai','Carson','Robert',
  'Angel','Axel','Everett','Eli','Easton','Jeremiah','Roman','Landon','Greyson','Wesley',
  'Waylon','Harrison','Jordan','Bennett','Micah','Weston','Emmett','Silas','Rowan','Beau',
  'Parker','Xavier','Declan','Jace','Kayden','Ryder','Sawyer','River','Gael','Atlas'
];

const SSA_GIRLS = [
  'Olivia','Emma','Charlotte','Amelia','Sophia','Mia','Isabella','Ava','Evelyn','Luna',
  'Harper','Sofia','Camila','Eleanor','Elizabeth','Violet','Scarlett','Emily','Hazel','Aria',
  'Penelope','Chloe','Layla','Mila','Nora','Avery','Riley','Ivy','Lily','Aurora',
  'Willow','Ella','Zoey','Isla','Ellie','Nova','Abigail','Madison','Grace','Emilia',
  'Gianna','Hannah','Stella','Paisley','Addison','Natalie','Leah','Savannah','Naomi','Maya',
  'Elena','Valentina','Josephine','Delilah','Alice','Claire','Sadie','Victoria','Lucy','Kennedy',
  'Lillian','Audrey','Bella','Eliana','Anna','Aaliyah','Kinsley','Jade','Athena','Hailey',
  'Genesis','Emery','Autumn','Vivian','Eva','Quinn','Serenity','Nevaeh','Piper','Leilani',
  'Allison','Ayla','Madelyn','Maria','Everleigh','Sophie','Peyton','Caroline','Brielle','Adeline',
  'Lydia','Cora','Ruby','Rylee','Liliana','Aubrey','Raelynn','Bailey','Brooklyn','Julia'
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'BumpMatch-NameFetcher/1.0 (baby name app; contact: ai@sherbetagency.com)' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function extractOrigin(text) {
  const patterns = [
    /(?:is\s+(?:a|an)\s+)(\w+)\s+(?:given\s+)?name/i,
    /(?:of|from)\s+(\w+)\s+origin/i,
    /(?:derived\s+from\s+(?:the\s+)?)?(\w+)\s+(?:word|root|term)/i,
    /(\w+)\s+(?:baby\s+)?name\s+meaning/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].length > 2 && m[1].length < 20) {
      const origin = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const skip = ['the', 'this', 'that', 'which', 'also', 'given', 'male', 'female', 'common', 'popular'];
      if (!skip.includes(origin.toLowerCase())) return origin;
    }
  }
  return null;
}

function extractMeaning(text) {
  const patterns = [
    /meaning\s+["']([^"']+)["']/i,
    /means?\s+["']([^"']+)["']/i,
    /meaning\s+(?:is\s+)?[""]([^""]+)[""\u201d]/i,
    /means?\s+(?:is\s+)?[""]([^""]+)[""\u201d]/i,
    /meaning\s+(\w[\w\s,;]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].length > 2) {
      let meaning = m[1].trim();
      if (meaning.length > 80) meaning = meaning.substring(0, 80).replace(/\s+\S*$/, '...');
      return meaning.charAt(0).toUpperCase() + meaning.slice(1);
    }
  }
  return null;
}

async function enrichName(name) {
  const urls = [
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}_(given_name)`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}_(name)`,
  ];

  for (const url of urls) {
    try {
      const res = await httpsGet(url);
      if (res.statusCode === 200) {
        const data = JSON.parse(res.body);
        if (data.extract) {
          const origin = extractOrigin(data.extract);
          const meaning = extractMeaning(data.extract);
          return { origin, meaning };
        }
      }
    } catch {}
  }
  return { origin: null, meaning: null };
}

async function main() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const results = [];
  let id = 1;

  console.log('=== SSA Popular Names Enricher ===\n');
  console.log(`Processing ${SSA_BOYS.length} boy names and ${SSA_GIRLS.length} girl names...\n`);

  // Process boys
  for (let i = 0; i < SSA_BOYS.length; i++) {
    const name = SSA_BOYS[i];
    process.stdout.write(`[${id}/${SSA_BOYS.length + SSA_GIRLS.length}] ${name} (boy)... `);
    const info = await enrichName(name);
    results.push({
      id: `ssa-${id}`,
      name,
      gender: 'boy',
      origin: info.origin || 'English',
      meaning: info.meaning || 'Popular name',
      language: 'English',
      popularity: 'popular',
      yearRank: i + 1,
    });
    console.log(`${info.origin || 'English'} — ${info.meaning || 'Popular name'}`);
    id++;
    await sleep(200);
  }

  // Process girls
  for (let i = 0; i < SSA_GIRLS.length; i++) {
    const name = SSA_GIRLS[i];
    process.stdout.write(`[${id}/${SSA_BOYS.length + SSA_GIRLS.length}] ${name} (girl)... `);
    const info = await enrichName(name);
    results.push({
      id: `ssa-${id}`,
      name,
      gender: 'girl',
      origin: info.origin || 'English',
      meaning: info.meaning || 'Popular name',
      language: 'English',
      popularity: 'popular',
      yearRank: i + 1,
    });
    console.log(`${info.origin || 'English'} — ${info.meaning || 'Popular name'}`);
    id++;
    await sleep(200);
  }

  const outputPath = path.join(outputDir, 'ssa-popular-names.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDone! Wrote ${results.length} names to ${outputPath}`);
}

main().catch(err => { console.error('Fatal error:', err.message); process.exit(1); });
