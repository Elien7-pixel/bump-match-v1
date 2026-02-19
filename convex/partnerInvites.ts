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

export const createInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Expire any existing pending invites from this user
    const existingInvites = await ctx.db
      .query("partnerInvites")
      .withIndex("by_user", (q) => q.eq("fromUserId", user._id))
      .collect();

    for (const invite of existingInvites) {
      if (invite.status === "pending") {
        await ctx.db.patch(invite._id, { status: "expired" });
      }
    }

    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    // Create new invite using user's invite code
    const inviteId = await ctx.db.insert("partnerInvites", {
      fromUserId: user._id,
      inviteCode: user.inviteCode,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return {
      inviteId,
      inviteCode: user.inviteCode,
      expiresAt,
    };
  },
});

export const getMyInvite = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    // Return user's permanent invite code
    return {
      inviteCode: user.inviteCode,
      inviteLink: `bumpmatch://join/${user.inviteCode}`,
    };
  },
});

export const validateInviteCode = query({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!user) {
      return { valid: false, message: "Invalid invite code" };
    }

    if (user.partnerId) {
      return { valid: false, message: "This user already has a partner" };
    }

    return {
      valid: true,
      fromUser: {
        firstName: user.firstName,
        surname: user.surname,
      },
    };
  },
});

export const acceptInvite = mutation({
  args: {
    token: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.partnerId) {
      throw new Error("You are already connected with a partner");
    }

    // Find the inviter by their invite code
    const inviter = await ctx.db
      .query("users")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!inviter) {
      throw new Error("Invalid invite code");
    }

    if (inviter._id === user._id) {
      throw new Error("Cannot connect with yourself");
    }

    if (inviter.partnerId) {
      throw new Error("This person is already connected with someone else");
    }

    // Connect both users
    await ctx.db.patch(user._id, { partnerId: inviter._id });
    await ctx.db.patch(inviter._id, { partnerId: user._id });

    // Update any pending invite
    const invite = await ctx.db
      .query("partnerInvites")
      .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (invite && invite.status === "pending") {
      await ctx.db.patch(invite._id, { status: "accepted" });
    }

    return {
      success: true,
      partner: {
        id: inviter._id,
        firstName: inviter.firstName,
        surname: inviter.surname,
      },
    };
  },
});
