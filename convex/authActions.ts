"use node";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper to send email via Google Apps Script
async function sendEmail(payload: Record<string, string>) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.log("Google Apps Script URL not configured, skipping email");
    return;
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow", // Apps Script redirects on deploy
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(`Email failed: ${result.error || "Unknown error"}`);
  }
}

// Public action that generates the token and sends the email
export const forgotPassword = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(internal.auth.generateResetToken, {
      email: args.email,
    });

    // Always return the same message regardless of whether the email exists
    const response = {
      success: true,
      message: "If this email exists, a reset code has been sent.",
    };

    if (!result.found) {
      return response;
    }

    await sendEmail({
      type: "reset",
      to: args.email.toLowerCase(),
      firstName: result.firstName!,
      resetToken: result.resetToken!,
    });

    return response;
  },
});

// Internal action to send welcome email after signup
export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    firstName: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      type: "welcome",
      to: args.email,
      firstName: args.firstName,
      inviteCode: args.inviteCode,
    });
  },
});
