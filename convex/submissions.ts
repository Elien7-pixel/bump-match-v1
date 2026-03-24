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

// Submit a new baby name for review
export const submitName = mutation({
  args: {
    token: v.string(),
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

    // Create the submission with pending status
    const submissionId = await ctx.db.insert("submittedNames", {
      name: args.name,
      gender: args.gender,
      origin: args.origin,
      meaning: args.meaning,
      language: args.language,
      submittedBy: user._id,
      submitterName: `${user.firstName} ${user.surname}`,
      status: "pending",
      createdAt: Date.now(),
    });

    // Auto-add to user's likedNames
    const nameId = `submitted_${submissionId}`;
    const existing = await ctx.db
      .query("likedNames")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("nameId", nameId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("likedNames", {
        userId: user._id,
        nameId,
        name: args.name,
        gender: args.gender,
        origin: args.origin,
        meaning: args.meaning,
        language: args.language,
        likedAt: Date.now(),
      });
    }

    return { success: true, submissionId };
  },
});

// Get all pending submissions (for admin dashboard)
export const getPendingSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const submissions = await ctx.db
      .query("submittedNames")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return submissions.map((s) => ({
      id: s._id,
      name: s.name,
      gender: s.gender,
      origin: s.origin,
      meaning: s.meaning,
      language: s.language,
      submittedBy: s.submittedBy,
      submitterName: s.submitterName,
      status: s.status,
      reviewedAt: s.reviewedAt,
      createdAt: s.createdAt,
    }));
  },
});

// Get all submissions with optional status filter (for admin dashboard)
export const getAllSubmissions = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    let submissions;
    if (args.status) {
      submissions = await ctx.db
        .query("submittedNames")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      submissions = await ctx.db
        .query("submittedNames")
        .collect();
    }

    return submissions.map((s) => ({
      id: s._id,
      name: s.name,
      gender: s.gender,
      origin: s.origin,
      meaning: s.meaning,
      language: s.language,
      submittedBy: s.submittedBy,
      submitterName: s.submitterName,
      status: s.status,
      reviewedAt: s.reviewedAt,
      createdAt: s.createdAt,
    }));
  },
});

// Review a submission (approve or reject)
export const reviewSubmission = mutation({
  args: {
    submissionId: v.id("submittedNames"),
    action: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Submission has already been reviewed");
    }

    const newStatus = args.action === "approve" ? "approved" : "rejected";

    await ctx.db.patch(args.submissionId, {
      status: newStatus as "approved" | "rejected",
      reviewedAt: Date.now(),
    });

    return { success: true, status: newStatus };
  },
});

// Get user's own submissions
export const getMySubmissions = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return [];
    }

    const submissions = await ctx.db
      .query("submittedNames")
      .withIndex("by_user", (q) => q.eq("submittedBy", user._id))
      .collect();

    return submissions.map((s) => ({
      id: s._id,
      name: s.name,
      gender: s.gender,
      origin: s.origin,
      meaning: s.meaning,
      language: s.language,
      status: s.status,
      reviewedAt: s.reviewedAt,
      createdAt: s.createdAt,
    }));
  },
});
