import * as db from "./db";
import { users, appointments } from "../drizzle/schema";
import { eq, and, gte, notInArray } from "drizzle-orm";

export interface UserDeletionCheck {
  canDelete: boolean;
  blockers: string[];
  futureAppointmentsCount?: number;
}

/**
 * Check if a user can delete their account
 * Returns blockers if user has dependencies that prevent deletion
 */
export async function checkUserDeletionDependencies(
  userId: string
): Promise<UserDeletionCheck> {
  const user = await db.getUser(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const blockers: string[] = [];
  const now = new Date();

  // Check for future appointments based on user role
  if (user.role === "artist") {
    // Artists must cancel/complete all future appointments
    const futureAppointments = await db.getAppointmentsForUser(userId, "artist");
    const upcomingAppointments = futureAppointments.filter(
      (apt) =>
        apt.startTime >= now &&
        apt.status !== "cancelled" &&
        apt.status !== "completed"
    );

    if (upcomingAppointments.length > 0) {
      blockers.push(
        `You have ${upcomingAppointments.length} upcoming appointment(s). Please cancel or complete them before deleting your account.`
      );
    }

    return {
      canDelete: blockers.length === 0,
      blockers,
      futureAppointmentsCount: upcomingAppointments.length,
    };
  }

  if (user.role === "client") {
    // Clients must cancel all future bookings
    const futureBookings = await db.getAppointmentsForUser(userId, "client");
    const upcomingBookings = futureBookings.filter(
      (apt) =>
        apt.startTime >= now &&
        apt.status !== "cancelled" &&
        apt.status !== "completed"
    );

    if (upcomingBookings.length > 0) {
      blockers.push(
        `You have ${upcomingBookings.length} upcoming booking(s). Please cancel them before deleting your account.`
      );
    }

    return {
      canDelete: blockers.length === 0,
      blockers,
      futureAppointmentsCount: upcomingBookings.length,
    };
  }

  return {
    canDelete: true,
    blockers: [],
  };
}

/**
 * Delete a user account with GDPR/CCPA compliance
 * - Soft deletes user with PII anonymization
 * - Preserves referential integrity for other users
 */
export async function deleteUserAccount(userId: string) {
  const user = await db.getUser(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.deletedAt) {
    throw new Error("User already deleted");
  }

  // Soft delete user with PII anonymization
  const anonymizedUser = await db.updateUserProfile(userId, {
    email: `deleted-${userId}@deleted.local`,
    name: null,
    phone: null,
    bio: null,
    avatar: null,
    deletedAt: new Date(),
  });

  console.log(`✅ Anonymized user ${userId} - PII removed`);

  // Note: We keep appointment records for the other party
  // The appointments table will still reference this user ID
  // but the user's personal information is now anonymized

  // TODO: Delete profile image from storage if exists
  // This would depend on your storage solution (Vercel Blob, S3, etc.)

  // TODO: Track deletion event in analytics
  // This helps understand why users are leaving

  return {
    success: true,
    anonymizedUser,
  };
}
