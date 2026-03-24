import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper to get user from token
async function getUserFromToken(ctx: any, token: string): Promise<Doc<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return await ctx.db.get(session.userId) as Doc<"users"> | null;
}

export const likeName = mutation({
  args: {
    token: v.string(),
    nameId: v.string(),
    name: v.string(),
    gender: v.union(v.literal("boy"), v.literal("girl"), v.literal("unisex")),
    origin: v.string(),
    meaning: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if already liked
    const existing = await ctx.db
      .query("likedNames")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("nameId", args.nameId)
      )
      .first();

    if (existing) {
      return { success: true, alreadyLiked: true };
    }

    await ctx.db.insert("likedNames", {
      userId: user._id,
      nameId: args.nameId,
      name: args.name,
      gender: args.gender,
      origin: args.origin,
      meaning: args.meaning,
      language: args.language,
      likedAt: Date.now(),
    });

    return { success: true, alreadyLiked: false };
  },
});

export const unlikeName = mutation({
  args: {
    token: v.string(),
    nameId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const likedName = await ctx.db
      .query("likedNames")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("nameId", args.nameId)
      )
      .first();

    if (likedName) {
      await ctx.db.delete(likedName._id);
    }

    return { success: true };
  },
});

export const getLikedNames = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return [];
    }

    const likedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return likedNames.map((ln) => ({
      id: ln.nameId,
      name: ln.name,
      gender: ln.gender,
      origin: ln.origin,
      meaning: ln.meaning,
      language: ln.language,
      likedAt: ln.likedAt,
      isFavorite: ln.isFavorite || false,
    }));
  },
});

export const getPartnerLikedNames = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || !user.partnerId) {
      return [];
    }

    const partnerLikedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user.partnerId!))
      .collect();

    return partnerLikedNames.map((ln) => ({
      id: ln.nameId,
      name: ln.name,
      gender: ln.gender,
      origin: ln.origin,
      meaning: ln.meaning,
      language: ln.language,
      likedAt: ln.likedAt,
    }));
  },
});

export const getMatchedNames = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || !user.partnerId) {
      return [];
    }

    // Get user's liked names
    const userLikedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get partner's liked names
    const partnerLikedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user.partnerId!))
      .collect();

    // Find matches (names that both have liked)
    const userNameIds = new Set(userLikedNames.map((ln) => ln.nameId));
    const matches = partnerLikedNames.filter((ln) => userNameIds.has(ln.nameId));

    return matches.map((ln) => ({
      id: ln.nameId,
      name: ln.name,
      gender: ln.gender,
      origin: ln.origin,
      meaning: ln.meaning,
      language: ln.language,
    }));
  },
});

export const toggleFavorite = mutation({
  args: {
    token: v.string(),
    nameId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const likedName = await ctx.db
      .query("likedNames")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("nameId", args.nameId)
      )
      .first();

    if (!likedName) {
      throw new Error("Name not found in liked list");
    }

    const newValue = !likedName.isFavorite;
    await ctx.db.patch(likedName._id, {
      isFavorite: newValue,
    });

    return { success: true, isFavorite: newValue };
  },
});

export const getLikedNameIds = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return [];
    }

    const likedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return likedNames.map((ln) => ln.nameId);
  },
});

export const clearAllLikedNames = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const likedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const ln of likedNames) {
      await ctx.db.delete(ln._id);
    }

    return { success: true, deleted: likedNames.length };
  },
});

export const clearAllFavorites = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const favorites = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let cleared = 0;
    for (const ln of favorites) {
      if (ln.isFavorite) {
        await ctx.db.patch(ln._id, { isFavorite: false });
        cleared++;
      }
    }

    return { success: true, cleared };
  },
});
