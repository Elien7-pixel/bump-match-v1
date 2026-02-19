import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Simple hash function — must match the one in auth.ts
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16) + "_" + password.length;
}

export const deleteAccount = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    // Verify password
    if (simpleHash(args.password) !== user.passwordHash) {
      return { success: false, error: "Invalid email or password." };
    }

    // Delete all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete all liked names
    const likedNames = await ctx.db
      .query("likedNames")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const liked of likedNames) {
      await ctx.db.delete(liked._id);
    }

    // Delete all partner invites
    const invites = await ctx.db
      .query("partnerInvites")
      .withIndex("by_user", (q) => q.eq("fromUserId", user._id))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Remove partner link from partner's account if exists
    if (user.partnerId) {
      const partner = await ctx.db.get(user.partnerId);
      if (partner && partner.partnerId?.toString() === user._id.toString()) {
        await ctx.db.patch(partner._id, { partnerId: undefined });
      }
    }

    // Delete the user
    await ctx.db.delete(user._id);

    return { success: true };
  },
});
