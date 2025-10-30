import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const notificationSettingsSchema = z.object({
  // Follow-up
  followupEnabled: z.boolean().optional(),
  followupSms: z.boolean().optional(),
  followupEmail: z.boolean().optional(),
  followupPush: z.boolean().optional(),
  followupText: z.string().optional(),
  followupTriggerType: z.enum(["after_sitting", "days", "weeks", "months"]).optional(),
  followupTriggerValue: z.number().optional(),
  
  // Aftercare
  aftercareEnabled: z.boolean().optional(),
  aftercareSms: z.boolean().optional(),
  aftercareEmail: z.boolean().optional(),
  aftercarePush: z.boolean().optional(),
  aftercareDailyMessage: z.string().optional(),
  aftercarePostMessage: z.string().optional(),
  aftercareFrequency: z.enum(["daily", "every_other_day", "twice_weekly", "weekly"]).optional(),
  aftercareDurationDays: z.number().optional(),
  aftercareTime: z.string().optional(),
  
  // Review
  reviewEnabled: z.boolean().optional(),
  reviewSms: z.boolean().optional(),
  reviewEmail: z.boolean().optional(),
  reviewPush: z.boolean().optional(),
  reviewText: z.string().optional(),
  reviewGoogleLink: z.string().optional(),
  reviewFacebookLink: z.string().optional(),
  reviewCustomLink: z.string().optional(),
  reviewTriggerType: z.enum(["after_sitting", "days", "weeks", "months"]).optional(),
  reviewTriggerValue: z.number().optional(),
  
  // Pre-booking
  prebookingEnabled: z.boolean().optional(),
  prebookingSms: z.boolean().optional(),
  prebookingEmail: z.boolean().optional(),
  prebookingPush: z.boolean().optional(),
  prebookingText: z.string().optional(),
  prebookingIncludeDetails: z.boolean().optional(),
  prebookingIncludeTime: z.boolean().optional(),
  prebookingIncludeMaps: z.boolean().optional(),
  prebookingTriggerType: z.enum(["hours", "days"]).optional(),
  prebookingTriggerValue: z.number().optional(),
  
  // Business Location
  businessLocation: z.string().optional(),
  businessAddress: z.string().optional(),
});

export const notificationSettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return await db.getNotificationSettings(ctx.user.id);
  }),
  
  update: protectedProcedure
    .input(notificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return await db.upsertNotificationSettings(ctx.user.id, input);
    }),
});

