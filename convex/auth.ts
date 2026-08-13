import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Simple hash function for demo purposes
// In production, use proper bcrypt or argon2 via an action
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16) + "_" + password.length;
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// Generate a random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a unique invite code
function generateInviteCode(surname: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${surname.toUpperCase().substring(0, 6)}-${random}`;
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    surname: v.string(),
    age: v.string(),
    gender: v.union(v.literal("mom"), v.literal("dad"), v.literal("partner")),
    expecting: v.optional(v.union(v.literal("boy"), v.literal("girl"), v.literal("unknown"))),
    status: v.string(),
    dueDate: v.optional(v.string()),
    country: v.optional(v.string()),
    province: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Create user
    const inviteCode = generateInviteCode(args.surname);
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash: simpleHash(args.password),
      firstName: args.firstName,
      surname: args.surname,
      age: args.age,
      gender: args.gender,
      expecting: args.expecting,
      status: args.status,
      dueDate: args.dueDate,
      country: args.country,
      province: args.province,
      inviteCode,
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: now,
      expiresAt,
    });

    // Schedule welcome email
    await ctx.scheduler.runAfter(0, internal.authActions.sendWelcomeEmail, {
      email: args.email.toLowerCase(),
      firstName: args.firstName,
      inviteCode,
    });

    return {
      userId,
      token,
      inviteCode,
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    // Create new session
    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: now,
      expiresAt,
    });

    return {
      userId: user._id,
      token,
      inviteCode: user.inviteCode,
    };
  },
});

export const verifyToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      inviteCode: user.inviteCode,
      partnerId: user.partnerId,
    };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Internal mutation to generate and store the reset token
export const generateResetToken = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      return { found: false };
    }

    const resetToken = generateToken().substring(0, 8).toUpperCase();
    const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

    await ctx.db.patch(user._id, {
      resetToken,
      resetTokenExpiry: resetExpiry,
    });

    return {
      found: true,
      resetToken,
      firstName: user.firstName,
    };
  },
});

export const resetPassword = mutation({
  args: {
    email: v.string(),
    resetCode: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid reset code");
    }

    if (!user.resetToken || user.resetToken !== args.resetCode.toUpperCase()) {
      throw new Error("Invalid reset code");
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      throw new Error("Reset code has expired");
    }

    // Update password and clear reset token
    await ctx.db.patch(user._id, {
      passwordHash: simpleHash(args.newPassword),
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    // Invalidate all existing sessions
    const sessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true, message: "Password reset successfully. Please log in." };
  },
});
