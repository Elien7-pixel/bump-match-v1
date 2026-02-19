"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

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

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("Email service is not configured.");
    }

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: "BumpMatch <noreply@sherbetagency.com>",
      to: args.email.toLowerCase(),
      subject: "Your BumpMatch Password Reset Code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #333; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #666; font-size: 16px;">Hi ${result.firstName},</p>
          <p style="color: #666; font-size: 16px;">Here is your password reset code:</p>
          <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${result.resetToken}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="color: #999; font-size: 12px;">BumpMatch - Find the perfect baby name together.</p>
        </div>
      `,
    });

    return response;
  },
});
