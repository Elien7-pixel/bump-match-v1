#!/usr/bin/env node

/**
 * Seed name embeddings into Convex for vector search.
 * Reads names from babyNames.ts and sends batches to the seedBatch action.
 *
 * Usage: node scripts/seed-embeddings.js
 *
 * Requires:
 * - GEMINI_API_KEY set in Convex env
 * - Convex dev server running or deployed
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse names from babyNames.ts
const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "data", "babyNames.ts"),
  "utf8"
);

const names = [];
const regex =
  /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*gender:\s*'([^']+)',\s*origin:\s*'([^']+)',\s*meaning:\s*'([^']*(?:\\'[^']*)*)',\s*language:\s*'([^']+)'/g;

let match;
while ((match = regex.exec(src)) !== null) {
  names.push({
    nameId: match[1],
    name: match[2],
    gender: match[3],
    origin: match[4],
    meaning: match[5].replace(/\\'/g, "'"),
    language: match[6],
  });
}

console.log(`Found ${names.length} names to embed\n`);

// Send in batches of 20 via Convex CLI
const BATCH_SIZE = 20;
const batches = [];
for (let i = 0; i < names.length; i += BATCH_SIZE) {
  batches.push(names.slice(i, i + BATCH_SIZE));
}

console.log(`Sending ${batches.length} batches of ${BATCH_SIZE}...\n`);

let completed = 0;
for (const batch of batches) {
  const argsJson = JSON.stringify({ names: batch });
  try {
    execSync(
      `npx convex run --no-push search:seedBatch '${argsJson.replace(/'/g, "'\\''")}'`,
      {
        cwd: path.join(__dirname, ".."),
        stdio: "pipe",
        timeout: 120000,
      }
    );
    completed += batch.length;
    console.log(`[${completed}/${names.length}] Embedded: ${batch.map((n) => n.name).join(", ")}`);
  } catch (e) {
    console.error(`Failed batch starting with ${batch[0].name}:`, e.message);
    // Try one at a time for failed batch
    for (const name of batch) {
      try {
        const singleArgs = JSON.stringify({ names: [name] });
        execSync(
          `npx convex run --no-push search:seedBatch '${singleArgs.replace(/'/g, "'\\''")}'`,
          {
            cwd: path.join(__dirname, ".."),
            stdio: "pipe",
            timeout: 60000,
          }
        );
        completed++;
        console.log(`  [${completed}/${names.length}] Retry OK: ${name.name}`);
      } catch (e2) {
        console.error(`  Failed: ${name.name} — ${e2.message}`);
        completed++;
      }
    }
  }
}

console.log(`\nDone! Embedded ${completed} names.`);
