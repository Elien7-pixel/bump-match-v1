import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Get a user's partner's push token (plus the partner id, so delivery
// failures can clear the right user's dead token).
export const getPartnerPushToken = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId) as Doc<"users"> | null;
    if (!user || !user.partnerId) {
      return null;
    }

    const partner = await ctx.db.get(user.partnerId) as Doc<"users"> | null;
    if (!partner || !partner.pushToken) {
      return null;
    }

    return { pushToken: partner.pushToken, partnerId: partner._id };
  },
});

// Get a specific user's push token
export const getUserPushToken = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId) as Doc<"users"> | null;
    if (!user || !user.pushToken) {
      return null;
    }

    return user.pushToken;
  },
});
