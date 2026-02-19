import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    firstName: v.string(),
    surname: v.string(),
    age: v.string(),
    gender: v.union(v.literal("mom"), v.literal("dad"), v.literal("partner")),
    status: v.string(),
    partnerId: v.optional(v.id("users")),
    inviteCode: v.string(),
    createdAt: v.number(),
    // Password reset fields
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_invite_code", ["inviteCode"]),

  // Liked names table
  likedNames: defineTable({
    userId: v.id("users"),
    nameId: v.string(),
    name: v.string(),
    gender: v.union(v.literal("boy"), v.literal("girl"), v.literal("unisex")),
    origin: v.string(),
    meaning: v.string(),
    language: v.string(),
    likedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "nameId"]),

  // Partner invites table
  partnerInvites: defineTable({
    fromUserId: v.id("users"),
    inviteCode: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_code", ["inviteCode"])
    .index("by_user", ["fromUserId"]),

  // Sessions table for JWT-like auth
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
});
