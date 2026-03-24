import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";

// Internal query to get embedding doc by ID (used by search action)
export const getEmbeddingById = internalQuery({
  args: { id: v.id("nameEmbeddings") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    return {
      nameId: doc.nameId,
      name: doc.name,
      meaning: doc.meaning,
      origin: doc.origin,
      gender: doc.gender,
      language: doc.language,
    };
  },
});

// Internal mutation to insert an embedding (used by seed action)
export const insertEmbedding = internalMutation({
  args: {
    nameId: v.string(),
    name: v.string(),
    meaning: v.string(),
    origin: v.string(),
    gender: v.string(),
    language: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("nameEmbeddings")
      .withIndex("by_nameId", (q) => q.eq("nameId", args.nameId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
        meaning: args.meaning,
        origin: args.origin,
      });
      return;
    }

    await ctx.db.insert("nameEmbeddings", args);
  },
});

// Get count of embeddings (for checking seed progress)
export const getEmbeddingCount = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("nameEmbeddings").collect();
    return all.length;
  },
});
