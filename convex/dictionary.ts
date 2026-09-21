"use node";
import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { vertexAuth, vertexUrl, VertexAuth } from "./vertex";

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

// Thrown as ConvexError so the app can show `data.message` as-is. A plain Error
// reaches the client wrapped in Convex's "[CONVEX A(...)] Server Error" text.
// The real cause (out of credits, bad key, outage) goes to the Convex logs only.
function oops(reason: string, detail?: unknown): ConvexError<{ code: string; message: string }> {
  console.error(`Dictionary lookup unavailable — ${reason}`, detail ?? "");
  return new ConvexError({
    code: "LOOKUP_UNAVAILABLE",
    message: "Our name dictionary is taking a little nap. Please try again later.",
  });
}

export const lookupName = action({
  args: {
    name: v.string(),
  },
  handler: async (_ctx, args): Promise<DictionaryEntry> => {
    const trimmed = args.name.trim();
    if (!trimmed) {
      throw new ConvexError({ code: "INVALID_NAME", message: "Type a baby name to look up its meaning." });
    }
    if (trimmed.length > 60) {
      throw new ConvexError({ code: "INVALID_NAME", message: "That name is a bit long — try a shorter one." });
    }

    let auth: VertexAuth;
    try {
      auth = await vertexAuth();
    } catch (e) {
      throw oops("Vertex auth failed", e);
    }

    let response: Response;
    try {
      response = await fetch(
        vertexUrl(auth, "gemini-2.5-flash", "generateContent"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
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
    } catch (e) {
      throw oops("network error calling Gemini", e);
    }

    if (!response.ok) {
      const errText = await response.text();
      // 429 / RESOURCE_EXHAUSTED is what running out of credits or quota looks like.
      const outOfCredits = response.status === 429 || errText.includes("RESOURCE_EXHAUSTED");
      throw oops(outOfCredits ? "out of Gemini credits/quota" : `Gemini HTTP ${response.status}`, errText);
    }

    const data = await response.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw oops("Gemini returned no content", data);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Strip code fences if Gemini ignored responseMimeType
      const stripped = text.replace(/```json\s*|\s*```/g, "").trim();
      try {
        parsed = JSON.parse(stripped);
      } catch {
        throw oops("Gemini returned unparseable JSON", text);
      }
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
