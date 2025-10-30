import { Router } from "express";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { notificationSettings } from "@db/schema";

const router = Router();

// Get notification settings for the authenticated user
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const settings = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, req.user.id),
    });

    // If no settings exist, return default settings
    if (!settings) {
      return res.json({
        followupEnabled: false,
        followupSms: false,
        followupEmail: false,
        followupPush: false,
        followupText: "",
        followupTriggerType: "days",
        followupTriggerValue: 1,
        
        aftercareEnabled: false,
        aftercareSms: false,
        aftercareEmail: false,
        aftercarePush: false,
        aftercareDailyMessage: "",
        aftercarePostMessage: "",
        aftercareFrequency: "daily",
        aftercareDurationDays: 14,
        aftercareTime: "09:00:00",
        
        reviewEnabled: false,
        reviewSms: false,
        reviewEmail: false,
        reviewPush: false,
        reviewText: "",
        reviewGoogleLink: "",
        reviewFacebookLink: "",
        reviewCustomLink: "",
        reviewTriggerType: "days",
        reviewTriggerValue: 7,
        
        prebookingEnabled: false,
        prebookingSms: false,
        prebookingEmail: false,
        prebookingPush: false,
        prebookingText: "",
        prebookingIncludeDetails: true,
        prebookingIncludeTime: true,
        prebookingIncludeMaps: true,
        prebookingTriggerType: "hours",
        prebookingTriggerValue: 24,
        
        businessLocation: "",
        businessAddress: "",
        businessLat: null,
        businessLng: null,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching notification settings:", error);
    res.status(500).send("Failed to fetch notification settings");
  }
});

// Update notification settings
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const settings = req.body;

    // Check if settings already exist
    const existing = await db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, req.user.id),
    });

    if (existing) {
      // Update existing settings
      await db
        .update(notificationSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(notificationSettings.userId, req.user.id));
    } else {
      // Create new settings
      await db.insert(notificationSettings).values({
        userId: req.user.id,
        ...settings,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error updating notification settings:", error);
    res.status(500).send("Failed to update notification settings");
  }
});

export default router;

