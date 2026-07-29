"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Send a push notification via Expo Push API
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    // When provided, a DeviceNotRegistered ticket clears this user's dead token.
    recipientUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate that it looks like an Expo push token
    if (!args.pushToken.startsWith("ExponentPushToken[")) {
      console.log("Invalid push token format, skipping:", args.pushToken);
      return;
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: args.pushToken,
          title: args.title,
          body: args.body,
          data: args.data || {},
          sound: "default",
          priority: "high",
        }),
      });

      const result = await response.json();
      if (result.errors) {
        console.error("Expo push notification errors:", result.errors);
        return;
      }
      // Expo also reports per-ticket failures inside data[]
      const tickets = Array.isArray(result.data) ? result.data : [result.data];
      for (const ticket of tickets) {
        if (ticket?.status === "error") {
          console.error("Expo push ticket error:", ticket.message, ticket.details);
          if (
            ticket.details?.error === "DeviceNotRegistered" &&
            args.recipientUserId
          ) {
            await ctx.runMutation(internal.users.clearPushToken, {
              userId: args.recipientUserId,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
    }
  },
});

// Notify a user's partner
export const notifyPartner = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const partnerInfo = await ctx.runQuery(
      internal.pushHelpers.getPartnerPushToken,
      { userId: args.userId }
    );

    if (!partnerInfo) {
      console.log("Partner has no push token, skipping notification");
      return;
    }

    await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken: partnerInfo.pushToken,
      title: args.title,
      body: args.body,
      data: args.data,
      recipientUserId: partnerInfo.partnerId,
    });
  },
});

// Notify a specific user by their ID
export const notifyUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const pushToken = await ctx.runQuery(
      internal.pushHelpers.getUserPushToken,
      { userId: args.userId }
    );

    if (!pushToken) {
      console.log("User has no push token, skipping notification");
      return;
    }

    await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken,
      title: args.title,
      body: args.body,
      data: args.data,
      recipientUserId: args.userId,
    });
  },
});
