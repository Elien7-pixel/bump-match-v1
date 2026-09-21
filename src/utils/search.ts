/**
 * Lower-case, accent-stripped, punctuation-free form used for matching, so
 * "reunion" finds Réunion, "cote divoire" finds Côte d'Ivoire, and
 * "st lucia" finds Saint Lucia.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bst\b/g, 'saint')
    .trim();
}

/** Levenshtein distance, bailing out early once it cannot come in under `max`. */
function editDistanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/** Every position in `name` a user might start typing from: the whole name and each later word. */
function prefixesOf(name: string): string[] {
  const words = name.split(' ');
  return words.map((_, i) => words.slice(i).join(' '));
}

/**
 * Filter and rank options against a search query. Tiers, best first:
 *   0 exact name          "kenya"
 *   1 exact alias         "uk", "usa", "sa"
 *   2 name prefix         "phil" → Philippines
 *   3 later-word prefix   "zealand" → New Zealand
 *   4 substring           "gua" → Nicaragua
 *   5 alias prefix        "swazi" → Eswatini
 * Within a tier the original order is kept. If nothing matches and the query
 * is long enough to be a real attempt, a typo-tolerant pass runs instead so
 * "philipines" still finds the Philippines (whole-name near-misses first,
 * then later-word and alias near-misses). An empty query returns the options
 * unchanged.
 */
export function searchOptions(
  options: string[],
  query: string,
  aliases: Record<string, string[]> = {},
): string[] {
  const q = normalizeForSearch(query);
  if (!q) return options;

  const normalizedAliases = (option: string) => (aliases[option] ?? []).map(normalizeForSearch);

  const ranked: { option: string; tier: number }[] = [];
  options.forEach((option) => {
    const name = normalizeForSearch(option);
    const optionAliases = normalizedAliases(option);
    let tier = -1;
    if (name === q) tier = 0;
    else if (optionAliases.includes(q)) tier = 1;
    else if (name.startsWith(q)) tier = 2;
    else if (name.includes(` ${q}`)) tier = 3;
    else if (name.includes(q)) tier = 4;
    else if (optionAliases.some((a) => a.startsWith(q) || a.includes(` ${q}`))) tier = 5;
    if (tier >= 0) ranked.push({ option, tier });
  });

  if (ranked.length === 0 && q.length >= 4) {
    // Compare against prefixes of the same length so a partially typed,
    // misspelled name still matches. One slip allowed, two for long queries.
    const tolerance = q.length >= 8 ? 2 : 1;
    const close = (candidate: string) => editDistanceWithin(q, candidate.slice(0, q.length), tolerance);
    options.forEach((option) => {
      const name = normalizeForSearch(option);
      if (close(name)) ranked.push({ option, tier: 6 });
      else if (prefixesOf(name).some(close) || normalizedAliases(option).some(close)) {
        ranked.push({ option, tier: 7 });
      }
    });
  }

  // Array.prototype.sort is stable, so original order is preserved within a tier.
  return ranked.sort((a, b) => a.tier - b.tier).map((r) => r.option);
}
