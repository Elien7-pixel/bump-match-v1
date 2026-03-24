"use node";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Generate embedding via Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini embedding failed: ${err}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Search names by meaning using vector search
export const searchNames = action({
  args: {
    query: v.string(),
    gender: v.optional(v.string()),
    language: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<{ nameId: string; name: string; meaning: string; origin: string; gender: string; language: string; score: number }>> => {
    const embedding = await generateEmbedding(args.query);

    const results = await ctx.vectorSearch("nameEmbeddings", "by_embedding", {
      vector: embedding,
      limit: args.limit || 20,
      filter: (args.gender && args.gender !== "all") || (args.language && args.language !== "All")
        ? (q: any) => {
            let f = q;
            if (args.gender && args.gender !== "all") f = f.eq("gender", args.gender);
            if (args.language && args.language !== "All") f = f.eq("language", args.language);
            return f;
          }
        : undefined,
    });

    // Fetch the full documents
    const docs: Array<{ nameId: string; name: string; meaning: string; origin: string; gender: string; language: string; score: number } | null> = await Promise.all(
      results.map(async (r: any): Promise<{ nameId: string; name: string; meaning: string; origin: string; gender: string; language: string; score: number } | null> => {
        const doc = await ctx.runQuery(internal.searchHelpers.getEmbeddingById, {
          id: r._id,
        });
        return doc ? { ...doc, score: r._score } : null;
      })
    );

    return docs.filter((d): d is NonNullable<typeof d> => d !== null);
  },
});

// Seed a batch of name embeddings
export const seedBatch = internalAction({
  args: {
    names: v.array(
      v.object({
        nameId: v.string(),
        name: v.string(),
        meaning: v.string(),
        origin: v.string(),
        gender: v.string(),
        language: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const name of args.names) {
      const text = `${name.name}: ${name.meaning}. Origin: ${name.origin}`;
      const embedding = await generateEmbedding(text);

      await ctx.runMutation(internal.searchHelpers.insertEmbedding, {
        nameId: name.nameId,
        name: name.name,
        meaning: name.meaning,
        origin: name.origin,
        gender: name.gender,
        language: name.language,
        embedding,
      });

      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 50));
    }
  },
});
