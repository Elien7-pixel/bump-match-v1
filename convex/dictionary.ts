"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";

interface DictionaryEntry {
  name: string;
  meaning: string;
  origin: string;
  gender: "boy" | "girl" | "unisex";
  pronunciation?: string;
  variants?: string[];
  famousPeople?: Array<{ name: string; description: string }>;
  notFound?: boolean;
}

const PROMPT_TEMPLATE = (name: string) => `You are a baby name dictionary. Return a JSON object with information about the given name.

Name: "${name}"

Return ONLY valid JSON (no markdown, no code fences, no commentary) with this exact shape:
{
  "name": "<canonical spelling of the name>",
  "meaning": "<short, plain-English meaning, 1-2 sentences>",
  "origin": "<language/culture of origin, e.g. 'Hebrew', 'Yoruba', 'Latin'>",
  "gender": "<one of: boy, girl, unisex>",
  "pronunciation": "<simple phonetic pronunciation, optional>",
  "variants": ["<alternate spelling 1>", "<alternate spelling 2>"],
  "famousPeople": [
    { "name": "<full name>", "description": "<one-line description, e.g. 'British actor', 'NBA player'>" }
  ]
}

Rules:
- "famousPeople" should list up to 5 well-known real people (celebrities, athletes, musicians, historical figures) with this first name. If none are well-known, return an empty array.
- If the name is not a real human name (gibberish, single letter, profanity, brand), return: {"notFound": true, "name": "${name}", "meaning": "", "origin": "", "gender": "unisex"}
- Keep "meaning" concise — no etymology essays.
- Use British English spelling.`;

export const lookupName = action({
  args: {
    name: v.string(),
  },
  handler: async (_ctx, args): Promise<DictionaryEntry> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new Error("Name is required");
    }
    if (trimmed.length > 60) {
      throw new Error("Name is too long");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: PROMPT_TEMPLATE(trimmed) }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini lookup failed: ${errText}`);
    }

    const data = await response.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned no content");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Strip code fences if Gemini ignored responseMimeType
      const stripped = text.replace(/```json\s*|\s*```/g, "").trim();
      parsed = JSON.parse(stripped);
    }

    return {
      name: parsed.name || trimmed,
      meaning: parsed.meaning || "",
      origin: parsed.origin || "",
      gender: ["boy", "girl", "unisex"].includes(parsed.gender)
        ? parsed.gender
        : "unisex",
      pronunciation: parsed.pronunciation,
      variants: Array.isArray(parsed.variants) ? parsed.variants : [],
      famousPeople: Array.isArray(parsed.famousPeople)
        ? parsed.famousPeople
        : [],
      notFound: parsed.notFound === true,
    };
  },
});
