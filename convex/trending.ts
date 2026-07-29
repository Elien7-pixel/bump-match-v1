import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Weekly-updatable trending names. Three ways the list changes:
//  1. The weekly cron (convex/crons.ts) derives it from the last 7 days of
//     likes across all users — zero-maintenance freshness.
//  2. adminSetTrending — manual override, guarded by ADMIN_TRENDING_KEY.
//  3. replaceTrending — internal helper both of the above call.

export const getTrending = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("trendingNames").collect();
    return rows
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({ name: r.name, rank: r.rank, weekOf: r.weekOf }));
  },
});

export const replaceTrending = internalMutation({
  args: {
    weekOf: v.string(),
    names: v.array(
      v.object({
        name: v.string(),
        rank: v.number(),
        nameId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("trendingNames").collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    const updatedAt = Date.now();
    for (const entry of args.names) {
      await ctx.db.insert("trendingNames", { ...entry, weekOf: args.weekOf, updatedAt });
    }
    return { inserted: args.names.length };
  },
});

/**
 * Manual weekly update, e.g.:
 *   npx convex run trending:adminSetTrending \
 *     '{"adminKey":"...","weekOf":"2026-07-27","names":[{"name":"Luna","rank":1}]}'
 * Requires the ADMIN_TRENDING_KEY env var on the deployment; fails closed.
 */
export const adminSetTrending = mutation({
  args: {
    adminKey: v.string(),
    weekOf: v.string(),
    names: v.array(
      v.object({
        name: v.string(),
        rank: v.number(),
        nameId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const expected = process.env.ADMIN_TRENDING_KEY;
    if (!expected || args.adminKey !== expected) {
      throw new Error("Not authorized");
    }
    const existing = await ctx.db.query("trendingNames").collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    const updatedAt = Date.now();
    for (const entry of args.names) {
      await ctx.db.insert("trendingNames", { ...entry, weekOf: args.weekOf, updatedAt });
    }
    return { inserted: args.names.length };
  },
});

/**
 * Weekly cron target: rank the most-liked names of the past 7 days. Keeps the
 * trending list alive with no manual work. Skips the update when the app had
 * fewer than 5 distinct liked names that week (early days) so the richer
 * bundled fallback stays in charge.
 */
export const refreshTrendingWeekly = internalMutation({
  args: {},
  handler: async (ctx) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const likes = await ctx.db.query("likedNames").collect();
    const counts = new Map<string, { name: string; count: number }>();
    for (const like of likes) {
      if (like.likedAt < weekAgo) continue;
      const key = like.name.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count++;
      else counts.set(key, { name: like.name, count: 1 });
    }
    const top = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    if (top.length < 5) {
      return { skipped: true, distinctNames: top.length };
    }
    const existing = await ctx.db.query("trendingNames").collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    const updatedAt = Date.now();
    const weekOf = new Date(updatedAt).toISOString().slice(0, 10);
    for (let i = 0; i < top.length; i++) {
      await ctx.db.insert("trendingNames", {
        name: top[i].name,
        rank: i + 1,
        weekOf,
        updatedAt,
      });
    }
    return { skipped: false, inserted: top.length };
  },
});
