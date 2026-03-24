import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

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

export const getProfile = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    let partner = null;
    if (user.partnerId) {
      const partnerDoc = await ctx.db.get(user.partnerId) as Doc<"users"> | null;
      if (partnerDoc) {
        partner = {
          id: partnerDoc._id,
          firstName: partnerDoc.firstName,
          surname: partnerDoc.surname,
        };
      }
    }

    // Calculate age from date of birth (stored in `age` field as ISO string)
    let calculatedAge: number | null = null;
    if (user.age) {
      try {
        const dob = new Date(user.age);
        if (!isNaN(dob.getTime())) {
          const today = new Date();
          let years = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            years--;
          }
          calculatedAge = years;
        }
      } catch {}
    }

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      dateOfBirth: user.age,
      age: calculatedAge,
      gender: user.gender,
      status: user.status,
      inviteCode: user.inviteCode,
      partner,
      createdAt: user.createdAt,
    };
  },
});

export const updateProfile = mutation({
  args: {
    token: v.string(),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    age: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("mom"), v.literal("dad"), v.literal("partner"))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const updates: Partial<Doc<"users">> = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.surname !== undefined) updates.surname = args.surname;
    if (args.age !== undefined) updates.age = args.age;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

export const connectPartner = mutation({
  args: {
    token: v.string(),
    partnerInviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Find partner by invite code
    const partner = await ctx.db
      .query("users")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.partnerInviteCode))
      .first();

    if (!partner) {
      throw new Error("Invalid invite code");
    }

    if (partner._id === user._id) {
      throw new Error("Cannot connect with yourself");
    }

    if (user.partnerId) {
      throw new Error("You are already connected with a partner");
    }

    if (partner.partnerId) {
      throw new Error("This person is already connected with someone else");
    }

    // Connect both users
    await ctx.db.patch(user._id, { partnerId: partner._id });
    await ctx.db.patch(partner._id, { partnerId: user._id });

    return {
      success: true,
      partner: {
        id: partner._id,
        firstName: partner.firstName,
        surname: partner.surname,
      },
    };
  },
});

export const disconnectPartner = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!user.partnerId) {
      throw new Error("You are not connected with a partner");
    }

    const partner = await ctx.db.get(user.partnerId) as Doc<"users"> | null;

    // Disconnect both users
    await ctx.db.patch(user._id, { partnerId: undefined });
    if (partner) {
      await ctx.db.patch(partner._id, { partnerId: undefined });
    }

    return { success: true };
  },
});

export const getPartnerInfo = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || !user.partnerId) {
      return null;
    }

    const partner = await ctx.db.get(user.partnerId) as Doc<"users"> | null;
    if (!partner) {
      return null;
    }

    return {
      id: partner._id,
      firstName: partner.firstName,
      surname: partner.surname,
      connectedAt: user.createdAt,
    };
  },
});

export const setMatchRevealDate = mutation({
  args: {
    token: v.string(),
    revealDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, { matchRevealDate: args.revealDate });

    // Also set on partner if connected
    if (user.partnerId) {
      await ctx.db.patch(user.partnerId, { matchRevealDate: args.revealDate });
    }

    return { success: true };
  },
});

export const getMatchRevealDate = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    return user.matchRevealDate || null;
  },
});
