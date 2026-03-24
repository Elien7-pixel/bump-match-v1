/**
 * fetch-celebrity-names.js
 *
 * Fetches baby names of famous celebrities' children, attempts to look up
 * meaning/origin from the Wikipedia API, and writes the results to
 * scripts/output/celebrity-names.json.
 *
 * Usage:  node scripts/fetch-celebrity-names.js
 *
 * Uses only built-in Node.js modules (https, fs, path).
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Hardcoded celebrity baby names (~75 entries)
// ---------------------------------------------------------------------------
const CELEBRITY_NAMES = [
  // ── Athletes ──────────────────────────────────────────────────────────
  { name: "Bronny", gender: "boy", celebrity: "LeBron James & Savannah James", defaultOrigin: "American", defaultMeaning: "Derived from father's name LeBron" },
  { name: "Bryce", gender: "boy", celebrity: "LeBron James & Savannah James", defaultOrigin: "Celtic", defaultMeaning: "Speckled, freckled" },
  { name: "Zhuri", gender: "girl", celebrity: "LeBron James & Savannah James", defaultOrigin: "African", defaultMeaning: "Beautiful" },
  { name: "Olympia", gender: "girl", celebrity: "Serena Williams & Alexis Ohanian", defaultOrigin: "Greek", defaultMeaning: "From Mount Olympus, heavenly" },
  { name: "Saint", gender: "boy", celebrity: "Kim Kardashian & Kanye West", defaultOrigin: "English", defaultMeaning: "Holy, sacred person" },
  { name: "North", gender: "girl", celebrity: "Kim Kardashian & Kanye West", defaultOrigin: "English", defaultMeaning: "Cardinal direction, symbolizing the highest point" },
  { name: "Chicago", gender: "girl", celebrity: "Kim Kardashian & Kanye West", defaultOrigin: "Native American", defaultMeaning: "Wild garlic place, named after the city" },
  { name: "Psalm", gender: "boy", celebrity: "Kim Kardashian & Kanye West", defaultOrigin: "Hebrew", defaultMeaning: "Sacred song or hymn" },
  { name: "Summit", gender: "boy", celebrity: "Lindsey Vonn", defaultOrigin: "English", defaultMeaning: "The highest point, peak" },
  { name: "Boomer", gender: "boy", celebrity: "David Wells", defaultOrigin: "English", defaultMeaning: "Large, notable, prosperous" },
  { name: "Jett", gender: "boy", celebrity: "John Travolta & Kelly Preston", defaultOrigin: "English", defaultMeaning: "Black gemstone, free and fast" },
  { name: "Cannon", gender: "boy", celebrity: "Larry King", defaultOrigin: "French", defaultMeaning: "Official of the church, clergyman" },

  // ── Musicians ─────────────────────────────────────────────────────────
  { name: "Blue Ivy", gender: "girl", celebrity: "Beyonce & Jay-Z", defaultOrigin: "American", defaultMeaning: "Named after the color blue and the ivy plant" },
  { name: "Rumi", gender: "girl", celebrity: "Beyonce & Jay-Z", defaultOrigin: "Persian", defaultMeaning: "Beauty, named after the poet Rumi" },
  { name: "Sir", gender: "boy", celebrity: "Beyonce & Jay-Z", defaultOrigin: "English", defaultMeaning: "Title of respect and honor" },
  { name: "Apple", gender: "girl", celebrity: "Gwyneth Paltrow & Chris Martin", defaultOrigin: "English", defaultMeaning: "The fruit, symbolizing sweetness" },
  { name: "Moses", gender: "boy", celebrity: "Gwyneth Paltrow & Chris Martin", defaultOrigin: "Hebrew", defaultMeaning: "Drawn out of the water, delivered" },
  { name: "Stormi", gender: "girl", celebrity: "Kylie Jenner & Travis Scott", defaultOrigin: "American", defaultMeaning: "Tempestuous, impetuous nature" },
  { name: "Aire", gender: "boy", celebrity: "Kylie Jenner & Travis Scott", defaultOrigin: "English", defaultMeaning: "Variant of Aire, relating to air and openness" },
  { name: "Dream", gender: "girl", celebrity: "Rob Kardashian & Blac Chyna", defaultOrigin: "English", defaultMeaning: "A cherished aspiration or vision" },
  { name: "True", gender: "girl", celebrity: "Khloe Kardashian & Tristan Thompson", defaultOrigin: "English", defaultMeaning: "Genuine, loyal, faithful" },
  { name: "Kulture", gender: "girl", celebrity: "Cardi B & Offset", defaultOrigin: "American", defaultMeaning: "Creative spelling of culture, arts and social heritage" },
  { name: "Wave", gender: "boy", celebrity: "Cardi B & Offset", defaultOrigin: "English", defaultMeaning: "Ocean wave, a surge of energy" },
  { name: "Willow", gender: "girl", celebrity: "Will Smith & Jada Pinkett Smith", defaultOrigin: "English", defaultMeaning: "Graceful, slender, like the willow tree" },
  { name: "Jaden", gender: "boy", celebrity: "Will Smith & Jada Pinkett Smith", defaultOrigin: "Hebrew", defaultMeaning: "God has heard, thankful" },
  { name: "Kingston", gender: "boy", celebrity: "Gwen Stefani & Gavin Rossdale", defaultOrigin: "English", defaultMeaning: "King's town" },
  { name: "Zuma", gender: "boy", celebrity: "Gwen Stefani & Gavin Rossdale", defaultOrigin: "Aztec", defaultMeaning: "Lord frowns in anger, peace" },
  { name: "Apollo", gender: "boy", celebrity: "Gwen Stefani & Gavin Rossdale", defaultOrigin: "Greek", defaultMeaning: "God of music, sun, and light" },
  { name: "Morocco", gender: "boy", celebrity: "Mariah Carey & Nick Cannon", defaultOrigin: "African", defaultMeaning: "Named after the country Morocco" },
  { name: "Monroe", gender: "girl", celebrity: "Mariah Carey & Nick Cannon", defaultOrigin: "Scottish", defaultMeaning: "Mouth of the river Roe" },
  { name: "Onyx", gender: "boy", celebrity: "Iggy Azalea & Playboi Carti", defaultOrigin: "Greek", defaultMeaning: "Black gemstone, claw or nail" },
  { name: "Daisy Dove", gender: "girl", celebrity: "Katy Perry & Orlando Bloom", defaultOrigin: "English", defaultMeaning: "Day's eye flower combined with the bird of peace" },
  { name: "Gravity", gender: "boy", celebrity: "Lucky Daye", defaultOrigin: "English", defaultMeaning: "The natural force of attraction" },
  { name: "Rumor", gender: "girl", celebrity: "Bruce Willis & Demi Moore", defaultOrigin: "English", defaultMeaning: "Hearsay, circulating story" },
  { name: "Tallulah", gender: "girl", celebrity: "Bruce Willis & Demi Moore", defaultOrigin: "Native American", defaultMeaning: "Leaping water, princess of abundance" },
  { name: "Scout", gender: "girl", celebrity: "Bruce Willis & Demi Moore", defaultOrigin: "English", defaultMeaning: "One who gathers information, explorer" },

  // ── Actors ────────────────────────────────────────────────────────────
  { name: "Suri", gender: "girl", celebrity: "Tom Cruise & Katie Holmes", defaultOrigin: "Hebrew/Persian", defaultMeaning: "Princess, red rose" },
  { name: "Shiloh", gender: "girl", celebrity: "Brad Pitt & Angelina Jolie", defaultOrigin: "Hebrew", defaultMeaning: "Peaceful one, tranquil" },
  { name: "Maddox", gender: "boy", celebrity: "Angelina Jolie & Brad Pitt", defaultOrigin: "Welsh", defaultMeaning: "Son of Madoc, fortunate" },
  { name: "Vivienne", gender: "girl", celebrity: "Angelina Jolie & Brad Pitt", defaultOrigin: "French", defaultMeaning: "Alive, lively, full of life" },
  { name: "Knox", gender: "boy", celebrity: "Angelina Jolie & Brad Pitt", defaultOrigin: "Scottish", defaultMeaning: "Round hill" },
  { name: "Zahara", gender: "girl", celebrity: "Angelina Jolie & Brad Pitt", defaultOrigin: "Hebrew/Arabic", defaultMeaning: "Flower, shining, radiance" },
  { name: "Hazel", gender: "girl", celebrity: "Julia Roberts & Daniel Moder", defaultOrigin: "English", defaultMeaning: "The hazel tree, light brown color" },
  { name: "Phinnaeus", gender: "boy", celebrity: "Julia Roberts & Daniel Moder", defaultOrigin: "Greek", defaultMeaning: "Oracle, variant of Phineas" },
  { name: "Bear", gender: "boy", celebrity: "Alicia Silverstone", defaultOrigin: "English", defaultMeaning: "Strong and brave like a bear" },
  { name: "Pilot", gender: "boy", celebrity: "Jason Lee", defaultOrigin: "English", defaultMeaning: "One who steers a ship or aircraft" },
  { name: "Luna", gender: "girl", celebrity: "Chrissy Teigen & John Legend", defaultOrigin: "Latin", defaultMeaning: "Moon" },
  { name: "Miles", gender: "boy", celebrity: "Chrissy Teigen & John Legend", defaultOrigin: "Latin", defaultMeaning: "Soldier, merciful" },
  { name: "Esti", gender: "girl", celebrity: "Chrissy Teigen & John Legend", defaultOrigin: "Spanish", defaultMeaning: "Star, variant of Esther" },
  { name: "Rani", gender: "girl", celebrity: "Kate Hudson & Danny Fujikawa", defaultOrigin: "Sanskrit", defaultMeaning: "Queen, sovereign" },
  { name: "Ryder", gender: "boy", celebrity: "Kate Hudson & Chris Robinson", defaultOrigin: "English", defaultMeaning: "Horseman, knight, mounted warrior" },
  { name: "Ever", gender: "girl", celebrity: "Milla Jovovich & Paul W.S. Anderson", defaultOrigin: "English", defaultMeaning: "Always, eternally" },
  { name: "Honor", gender: "girl", celebrity: "Jessica Alba & Cash Warren", defaultOrigin: "English", defaultMeaning: "Dignity, respect, integrity" },
  { name: "Haven", gender: "girl", celebrity: "Jessica Alba & Cash Warren", defaultOrigin: "English", defaultMeaning: "Safe place, refuge" },
  { name: "Hayes", gender: "boy", celebrity: "Jessica Alba & Cash Warren", defaultOrigin: "English", defaultMeaning: "Hedged area, from the hedge" },
  { name: "Harlow", gender: "girl", celebrity: "Nicole Richie & Joel Madden", defaultOrigin: "English", defaultMeaning: "Army hill, rock hill" },
  { name: "Sparrow", gender: "boy", celebrity: "Nicole Richie & Joel Madden", defaultOrigin: "English", defaultMeaning: "Small bird, free spirit" },
  { name: "Everly", gender: "girl", celebrity: "Channing Tatum & Jenna Dewan", defaultOrigin: "English", defaultMeaning: "From the boar meadow, wild boar in woodland" },
  { name: "Wyatt", gender: "girl", celebrity: "Ashton Kutcher & Mila Kunis", defaultOrigin: "English", defaultMeaning: "Brave in war, hardy" },
  { name: "Dimitri", gender: "boy", celebrity: "Ashton Kutcher & Mila Kunis", defaultOrigin: "Greek", defaultMeaning: "Follower of Demeter, earth lover" },
  { name: "Dusty Rose", gender: "girl", celebrity: "Adam Levine & Behati Prinsloo", defaultOrigin: "English", defaultMeaning: "Muted pink color, gentle and warm" },
  { name: "Gio Grace", gender: "girl", celebrity: "Adam Levine & Behati Prinsloo", defaultOrigin: "Italian/English", defaultMeaning: "God is gracious combined with elegance" },
  { name: "Cricket", gender: "girl", celebrity: "Busy Philipps", defaultOrigin: "English", defaultMeaning: "A chirping insect, lively and spirited" },
  { name: "Birdie", gender: "girl", celebrity: "Busy Philipps", defaultOrigin: "English", defaultMeaning: "Little bird, bright and famous" },

  // ── Royals ────────────────────────────────────────────────────────────
  { name: "Archie", gender: "boy", celebrity: "Prince Harry & Meghan Markle", defaultOrigin: "German", defaultMeaning: "Truly brave, bold" },
  { name: "Lilibet", gender: "girl", celebrity: "Prince Harry & Meghan Markle", defaultOrigin: "English", defaultMeaning: "Pledged to God, family nickname for Queen Elizabeth" },
  { name: "George", gender: "boy", celebrity: "Prince William & Kate Middleton", defaultOrigin: "Greek", defaultMeaning: "Farmer, earth worker" },
  { name: "Charlotte", gender: "girl", celebrity: "Prince William & Kate Middleton", defaultOrigin: "French", defaultMeaning: "Free woman, petite" },
  { name: "Louis", gender: "boy", celebrity: "Prince William & Kate Middleton", defaultOrigin: "French", defaultMeaning: "Renowned warrior, famous in battle" },

  // ── Tech / Media ──────────────────────────────────────────────────────
  { name: "Nevada", gender: "boy", celebrity: "Elon Musk & Justine Wilson", defaultOrigin: "Spanish", defaultMeaning: "Snow-capped, from the snowy land" },
  { name: "Saxon", gender: "boy", celebrity: "Elon Musk & Justine Wilson", defaultOrigin: "German", defaultMeaning: "Swordsman, from the Saxon people" },
  { name: "Damian", gender: "boy", celebrity: "Elon Musk & Justine Wilson", defaultOrigin: "Greek", defaultMeaning: "To tame, powerful spirit" },
  { name: "Kai", gender: "boy", celebrity: "Elon Musk & Justine Wilson", defaultOrigin: "Hawaiian", defaultMeaning: "Sea, ocean" },
  { name: "August", gender: "girl", celebrity: "Princess Eugenie", defaultOrigin: "Latin", defaultMeaning: "Great, magnificent, venerable" },
  { name: "Chet", gender: "boy", celebrity: "Tom Hanks & Rita Wilson", defaultOrigin: "English", defaultMeaning: "Fortress, camp" },
  { name: "Truman", gender: "boy", celebrity: "Tom Hanks & Rita Wilson", defaultOrigin: "English", defaultMeaning: "Loyal one, faithful man" },
  { name: "Phoebe", gender: "girl", celebrity: "Bill Gates & Melinda French Gates", defaultOrigin: "Greek", defaultMeaning: "Bright, shining, radiant" },
  { name: "Rory", gender: "boy", celebrity: "Bill Gates & Melinda French Gates", defaultOrigin: "Irish", defaultMeaning: "Red king" },
  { name: "Vida", gender: "girl", celebrity: "Matthew McConaughey & Camila Alves", defaultOrigin: "Spanish", defaultMeaning: "Life" },
  { name: "Levi", gender: "boy", celebrity: "Matthew McConaughey & Camila Alves", defaultOrigin: "Hebrew", defaultMeaning: "Joined, attached" },
  { name: "Livingston", gender: "boy", celebrity: "Matthew McConaughey & Camila Alves", defaultOrigin: "Scottish", defaultMeaning: "From Levi's town, dear friend's place" },
];

// ---------------------------------------------------------------------------
// Wikipedia lookup helper
// ---------------------------------------------------------------------------

/**
 * Attempt to fetch a Wikipedia summary for a given name's page.
 * Tries: "{FirstWord}_(given_name)" then "{FirstWord}_(name)".
 * Returns the extract string or null.
 */
function fetchWikipediaSummary(name) {
  // Use only the first word for compound names like "Blue Ivy"
  const lookupName = name.split(" ")[0];

  const urls = [
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(lookupName)}_(given_name)`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(lookupName)}_(name)`,
  ];

  return tryUrls(urls, 0);
}

function tryUrls(urls, index) {
  return new Promise((resolve) => {
    if (index >= urls.length) {
      resolve(null);
      return;
    }

    const url = urls[index];

    https
      .get(url, { headers: { "User-Agent": "BumpMatchApp/1.0 (baby name research)" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              if (json.extract && json.extract.length > 30) {
                resolve(json.extract);
                return;
              }
            } catch (_) {
              // ignore parse errors
            }
          }
          // Try next URL
          tryUrls(urls, index + 1).then(resolve);
        });
      })
      .on("error", () => {
        tryUrls(urls, index + 1).then(resolve);
      });
  });
}

/**
 * Try to extract origin / meaning info from a Wikipedia extract string.
 * Returns { origin, meaning } or nulls.
 */
function parseExtract(extract) {
  const result = { origin: null, meaning: null };
  if (!extract) return result;

  // Try to detect origin from common phrases
  const originPatterns = [
    /of\s+(Hebrew|Greek|Latin|Arabic|Persian|Sanskrit|Celtic|German|French|English|Spanish|Italian|Irish|Scottish|Welsh|Japanese|Hawaiian|African|Native American|Old English|Old Norse|Slavic|Turkish|Chinese|Korean|Scandinavian|Dutch|Portuguese|Polish|Russian|Gaelic)\s+origin/i,
    /is\s+(?:a\s+)?(?:given\s+)?name\s+of\s+(Hebrew|Greek|Latin|Arabic|Persian|Sanskrit|Celtic|German|French|English|Spanish|Italian|Irish|Scottish|Welsh|Japanese|Hawaiian|African|Native American|Old English|Old Norse|Slavic|Turkish|Chinese|Korean|Scandinavian|Dutch|Portuguese|Polish|Russian|Gaelic)/i,
    /(?:derived|comes?)\s+from\s+(?:the\s+)?(Hebrew|Greek|Latin|Arabic|Persian|Sanskrit|Celtic|German|French|English|Spanish|Italian|Irish|Scottish|Welsh|Japanese|Hawaiian|African|Native American|Old English|Old Norse|Slavic|Turkish|Chinese|Korean|Scandinavian|Dutch|Portuguese|Polish|Russian|Gaelic)/i,
  ];

  for (const pat of originPatterns) {
    const m = extract.match(pat);
    if (m) {
      result.origin = m[1];
      break;
    }
  }

  // Try to extract meaning from common phrasing
  const meaningPatterns = [
    /means?\s+"([^"]+)"/i,
    /means?\s+'([^']+)'/i,
    /meaning\s+"([^"]+)"/i,
    /meaning\s+'([^']+)'/i,
    /meaning\s+(?:is\s+)?"?([^".]+)"?\./i,
  ];

  for (const pat of meaningPatterns) {
    const m = extract.match(pat);
    if (m) {
      result.meaning = m[1].trim();
      break;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Delay helper
// ---------------------------------------------------------------------------
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const outputDir = path.join(__dirname, "output");
  const outputFile = path.join(outputDir, "celebrity-names.json");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Processing ${CELEBRITY_NAMES.length} celebrity baby names...\n`);

  const results = [];

  for (let i = 0; i < CELEBRITY_NAMES.length; i++) {
    const entry = CELEBRITY_NAMES[i];
    const label = `[${i + 1}/${CELEBRITY_NAMES.length}]`;

    process.stdout.write(`${label} Looking up "${entry.name}"...`);

    let wikiOrigin = null;
    let wikiMeaning = null;

    try {
      const extract = await fetchWikipediaSummary(entry.name);
      if (extract) {
        const parsed = parseExtract(extract);
        wikiOrigin = parsed.origin;
        wikiMeaning = parsed.meaning;
        if (wikiOrigin || wikiMeaning) {
          process.stdout.write(" Wikipedia data found!");
        } else {
          process.stdout.write(" Wikipedia page found but no structured meaning.");
        }
      } else {
        process.stdout.write(" No Wikipedia data.");
      }
    } catch (err) {
      process.stdout.write(` Error: ${err.message}`);
    }

    console.log("");

    results.push({
      id: `celeb-${i + 1}`,
      name: entry.name,
      gender: entry.gender,
      origin: wikiOrigin || entry.defaultOrigin,
      meaning: wikiMeaning || entry.defaultMeaning,
      language: mapOriginToLanguage(wikiOrigin || entry.defaultOrigin),
      popularity: "popular",
      celebrity: entry.celebrity,
    });

    // Respectful delay between Wikipedia requests
    if (i < CELEBRITY_NAMES.length - 1) {
      await delay(200);
    }
  }

  // Write results
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\nDone! Wrote ${results.length} names to ${outputFile}`);
}

/**
 * Map an origin string to a language string for the BabyName model.
 */
function mapOriginToLanguage(origin) {
  if (!origin) return "English";

  const mapping = {
    Hebrew: "Hebrew",
    Greek: "Greek",
    Latin: "Latin",
    Arabic: "Arabic",
    Persian: "Persian",
    Sanskrit: "Hindi",
    Celtic: "Irish",
    German: "German",
    French: "French",
    English: "English",
    American: "English",
    Spanish: "Spanish",
    Italian: "Italian",
    Irish: "Irish",
    Scottish: "Scottish Gaelic",
    Welsh: "Welsh",
    Japanese: "Japanese",
    Hawaiian: "Hawaiian",
    African: "African",
    "Native American": "English",
    "Old English": "English",
    "Old Norse": "Norse",
    Slavic: "Slavic",
    Turkish: "Turkish",
    Chinese: "Chinese",
    Korean: "Korean",
    Scandinavian: "Norse",
    Dutch: "Dutch",
    Portuguese: "Portuguese",
    Polish: "Polish",
    Russian: "Russian",
    Gaelic: "Irish",
    Aztec: "Nahuatl",
    "Hebrew/Persian": "Hebrew",
    "Hebrew/Arabic": "Hebrew",
    "Italian/English": "Italian",
  };

  return mapping[origin] || "English";
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
