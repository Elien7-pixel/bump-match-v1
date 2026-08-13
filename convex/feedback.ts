import { mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const MAX_MESSAGE = 4000;

/**
 * Submit in-app feedback. The token is optional on purpose: a bad experience is
 * worth capturing even if the session has lapsed, and refusing the submission
 * would lose exactly the feedback we most want. When a valid token is supplied
 * we attach the account so we can follow up.
 */
export const submitFeedback = mutation({
  args: {
    token: v.optional(v.string()),
    message: v.string(),
    rating: v.optional(v.number()),
    platform: v.optional(v.string()),
    appVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (!message) throw new Error("Please write a little something first.");
    if (message.length > MAX_MESSAGE) {
      throw new Error("That message is too long — please keep it under 4000 characters.");
    }
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Invalid rating.");
    }

    let userId = undefined;
    let email = undefined;
    let name = undefined;

    if (args.token) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token as string))
        .first();
      if (session && session.expiresAt > Date.now()) {
        const user = await ctx.db.get(session.userId);
        if (user) {
          userId = user._id;
          email = user.email;
          name = `${user.firstName} ${user.surname}`.trim();
        }
      }
    }

    await ctx.db.insert("feedback", {
      userId,
      email,
      name,
      message,
      rating: args.rating,
      platform: args.platform,
      appVersion: args.appVersion,
      handled: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Internal-only: feedback carries the author's email, so it must stay reachable
// only from the admin-key-gated HTTP routes, never from the client.
export const getAllFeedback = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("feedback").withIndex("by_created").order("desc").collect();
    return rows.map((r) => ({
      id: r._id as string,
      createdAt: r.createdAt,
      name: r.name ?? "",
      email: r.email ?? "",
      message: r.message,
      rating: r.rating ?? null,
      platform: r.platform ?? "",
      appVersion: r.appVersion ?? "",
      handled: Boolean(r.handled),
    }));
  },
});
