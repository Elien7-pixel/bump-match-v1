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
    expecting: v.optional(v.union(v.literal("boy"), v.literal("girl"), v.literal("unknown"))),
    heritage: v.optional(v.array(v.string())),
    status: v.string(),
    // Month-only "YYYY-MM" for accounts created since the month-picker change;
    // older rows hold a full "YYYY-MM-DD". Only set when status is "Expecting soon".
    dueDate: v.optional(v.string()),
    // Where the user is. Optional because the 50-odd accounts that predate this
    // were never asked — they fill it in from their profile rather than through
    // an update, so both fields have to tolerate being absent indefinitely.
    country: v.optional(v.string()),
    province: v.optional(v.string()),
    // Partner Offers (Section 5 of the privacy policy). Opt-in only, never
    // pre-ticked, never a condition of using the App. The timestamp matters as
    // much as the boolean — consent has to be demonstrable, not just current.
    partnerOffersOptIn: v.optional(v.boolean()),
    partnerOffersOptInAt: v.optional(v.number()),
    partnerId: v.optional(v.id("users")),
    matchRevealDate: v.optional(v.number()),
    revealDateProposedBy: v.optional(v.id("users")),
    revealDateConfirmed: v.optional(v.boolean()),
    inviteCode: v.string(),
    createdAt: v.number(),
    // Password reset fields
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
    pushToken: v.optional(v.string()),
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
    isFavorite: v.optional(v.boolean()),
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

  // Name embeddings for vector search
  nameEmbeddings: defineTable({
    nameId: v.string(),
    name: v.string(),
    meaning: v.string(),
    origin: v.string(),
    gender: v.string(),
    language: v.string(),
    embedding: v.array(v.float64()),
  })
    .index("by_nameId", ["nameId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["gender", "language"],
    }),

  // Crowdsourced baby name submissions
  submittedNames: defineTable({
    name: v.string(),
    gender: v.union(v.literal("boy"), v.literal("girl"), v.literal("unisex")),
    origin: v.string(),
    meaning: v.string(),
    language: v.string(),
    submittedBy: v.id("users"),
    submitterName: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_user", ["submittedBy"]),

  // Weekly-updatable trending list. The client overlays these names onto the
  // bundled catalogue's "Trending" filter when online; the bundled popularity
  // flags remain the offline fallback.
  trendingNames: defineTable({
    name: v.string(),
    rank: v.number(),
    nameId: v.optional(v.string()),
    weekOf: v.string(),
    updatedAt: v.number(),
  }).index("by_rank", ["rank"]),

  // In-app feedback. Until now the only channel was App Store reviews, which
  // almost nobody writes — this is the one people will actually use, so it is
  // deliberately low-friction: a rating is optional and the message is the point.
  feedback: defineTable({
    // Absent for feedback left before signing in, or if the token has expired.
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    message: v.string(),
    // 1-5 stars, optional — a rating with no words is still a signal.
    rating: v.optional(v.number()),
    platform: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    // Set from the admin dashboard once someone has actually read it.
    handled: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_handled", ["handled"]),
});
