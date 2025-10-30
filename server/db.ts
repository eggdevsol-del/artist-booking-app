import { and, desc, eq, gte, lte, not, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  appointments,
  artistSettings,
  consultations,
  conversations,
  InsertAppointment,
  InsertArtistSettings,
  InsertConsultation,
  InsertConversation,
  InsertMessage,
  InsertNotificationTemplate,
  InsertPolicy,
  InsertPushSubscription,
  InsertQuickActionButton,
  InsertSocialMessageSync,
  InsertUser,
  messages,
  notificationTemplates,
  policies,
  pushSubscriptions,
  quickActionButtons,
  socialMessageSync,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User operations
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "phone",
      "avatar",
      "bio",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = "admin";
        values.role = "admin";
        updateSet.role = "admin";
      }
    } else {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getArtists() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get artists: database not available");
    return [];
  }

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      bio: users.bio,
      instagramUsername: users.instagramUsername,
    })
    .from(users)
    .where(or(eq(users.role, 'artist'), eq(users.role, 'admin')));

  return result;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<InsertUser>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(users).set(updates).where(eq(users.id, userId));
  return getUser(userId);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by email: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: string) {
  return getUser(id);
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return undefined;
  }

  try {
    console.log("[Database] Creating user:", { id: user.id, email: user.email, name: user.name });
    await db.insert(users).values(user);
    console.log("[Database] User created successfully:", user.id);
    return getUser(user.id!);
  } catch (error) {
    console.error("[Database] Error creating user:", error);
    throw error;
  }
}

export async function updateUserLastSignedIn(userId: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

// ============================================================================
// Artist Settings operations
// ============================================================================

export async function getArtistSettings(userId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(artistSettings)
    .where(eq(artistSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertArtistSettings(settings: InsertArtistSettings) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getArtistSettings(settings.userId);

  if (existing) {
    await db
      .update(artistSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(artistSettings.userId, settings.userId));
  } else {
    await db.insert(artistSettings).values(settings);
  }

  return getArtistSettings(settings.userId);
}

// ============================================================================
// Conversation operations
// ============================================================================

export async function getConversation(artistId: string, clientId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.artistId, artistId),
        eq(conversations.clientId, clientId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createConversation(conv: InsertConversation) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(conversations).values(conv);
  return getConversationById(Number(result[0].insertId));
}

export async function getConversationsForUser(userId: string, role: string) {
  const db = await getDb();
  if (!db) return [];

  const condition =
    role === "artist"
      ? eq(conversations.artistId, userId)
      : eq(conversations.clientId, userId);

  return db
    .select()
    .from(conversations)
    .where(condition)
    .orderBy(desc(conversations.lastMessageAt));
}

export async function updateConversationTimestamp(conversationId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

// ============================================================================
// Message operations
// ============================================================================

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(messages).values(message);
  await updateConversationTimestamp(message.conversationId);

  const inserted = await db
    .select()
    .from(messages)
    .where(eq(messages.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function getMessages(conversationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function getMessageById(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  return result[0];
}

export async function updateMessageMetadata(messageId: number, metadata: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(messages)
    .set({ metadata })
    .where(eq(messages.id, messageId));
}

export async function getUnreadMessageCount(conversationId: number, userId: string) {
  const db = await getDb();
  if (!db) return 0;

  const allMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        not(eq(messages.senderId, userId))
      )
    );

  // Count messages not read by this user
  const unreadCount = allMessages.filter(msg => {
    if (!msg.readBy) return true;
    try {
      const readByList = JSON.parse(msg.readBy);
      return !readByList.includes(userId);
    } catch {
      return true;
    }
  }).length;

  return unreadCount;
}

export async function markMessagesAsRead(conversationId: number, userId: string) {
  const db = await getDb();
  if (!db) return;

  const allMessages = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        not(eq(messages.senderId, userId))
      )
    );

  for (const msg of allMessages) {
    let readByList: string[] = [];
    if (msg.readBy) {
      try {
        readByList = JSON.parse(msg.readBy);
      } catch {
        readByList = [];
      }
    }

    if (!readByList.includes(userId)) {
      readByList.push(userId);
      await db
        .update(messages)
        .set({ readBy: JSON.stringify(readByList) })
        .where(eq(messages.id, msg.id));
    }
  }
}

// ============================================================================
// Appointment operations
// ============================================================================

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(appointments).values(appointment);

  const inserted = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function getAppointment(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateAppointment(
  id: number,
  updates: Partial<InsertAppointment>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(appointments)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(appointments.id, id));

  return getAppointment(id);
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(appointments).where(eq(appointments.id, id));
  return true;
}

export async function getAppointmentsForUser(
  userId: string,
  role: string,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    role === "artist"
      ? eq(appointments.artistId, userId)
      : eq(appointments.clientId, userId),
  ];

  if (startDate) {
    conditions.push(gte(appointments.startTime, startDate));
  }

  if (endDate) {
    conditions.push(lte(appointments.startTime, endDate));
  }

  // Join with users table to get client/artist names
  const results = await db
    .select({
      id: appointments.id,
      conversationId: appointments.conversationId,
      artistId: appointments.artistId,
      clientId: appointments.clientId,
      title: appointments.title,
      description: appointments.description,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      serviceName: appointments.serviceName,
      price: appointments.price,
      depositAmount: appointments.depositAmount,
      depositPaid: appointments.depositPaid,
      confirmationSent: appointments.confirmationSent,
      reminderSent: appointments.reminderSent,
      followUpSent: appointments.followUpSent,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      clientName: users.name,
      clientEmail: users.email,
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.clientId, users.id))
    .where(and(...conditions))
    .orderBy(appointments.startTime);

  return results;
}

export async function getAppointmentsByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(appointments)
    .where(eq(appointments.conversationId, conversationId))
    .orderBy(desc(appointments.startTime));
}

// ============================================================================
// Quick Action Button operations
// ============================================================================

export async function getQuickActionButtons(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(quickActionButtons)
    .where(eq(quickActionButtons.userId, userId))
    .orderBy(quickActionButtons.position);
}

export async function createQuickActionButton(button: InsertQuickActionButton) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(quickActionButtons).values(button);

  const inserted = await db
    .select()
    .from(quickActionButtons)
    .where(eq(quickActionButtons.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function updateQuickActionButton(
  id: number,
  updates: Partial<InsertQuickActionButton>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(quickActionButtons)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(quickActionButtons.id, id));

  const updated = await db
    .select()
    .from(quickActionButtons)
    .where(eq(quickActionButtons.id, id))
    .limit(1);

  return updated[0];
}

export async function deleteQuickActionButton(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(quickActionButtons).where(eq(quickActionButtons.id, id));
  return true;
}

// ============================================================================
// Notification Template operations
// ============================================================================

export async function getNotificationTemplates(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.userId, userId));
}

export async function createNotificationTemplate(
  template: InsertNotificationTemplate
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(notificationTemplates).values(template);

  const inserted = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function updateNotificationTemplate(
  id: number,
  updates: Partial<InsertNotificationTemplate>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(notificationTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(notificationTemplates.id, id));

  const updated = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.id, id))
    .limit(1);

  return updated[0];
}

export async function deleteNotificationTemplate(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(notificationTemplates)
    .where(eq(notificationTemplates.id, id));
  return true;
}

// ============================================================================
// Push Subscription operations
// ============================================================================

export async function createPushSubscription(sub: InsertPushSubscription) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(pushSubscriptions).values(sub);

  const inserted = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function getPushSubscriptions(userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function deletePushSubscription(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  return true;
}

// ============================================================================
// Policy operations
// ============================================================================

export async function getPolicies(artistId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(policies)
    .where(eq(policies.artistId, artistId));
}

export async function getPolicyByType(
  artistId: string,
  policyType: "deposit" | "design" | "reschedule" | "cancellation"
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(policies)
    .where(
      and(eq(policies.artistId, artistId), eq(policies.policyType, policyType))
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPolicy(policy: InsertPolicy) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getPolicyByType(
    policy.artistId,
    policy.policyType as any
  );

  if (existing) {
    await db
      .update(policies)
      .set({ ...policy, updatedAt: new Date() })
      .where(eq(policies.id, existing.id));
    return getPolicyByType(policy.artistId, policy.policyType as any);
  } else {
    const result = await db.insert(policies).values(policy);
    const inserted = await db
      .select()
      .from(policies)
      .where(eq(policies.id, Number(result[0].insertId)))
      .limit(1);
    return inserted[0];
  }
}

export async function deletePolicy(id: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(policies).where(eq(policies.id, id));
  return true;
}

// ============================================================================
// Consultation operations
// ============================================================================

export async function createConsultation(consultation: InsertConsultation) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(consultations).values(consultation);
  const inserted = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, Number(result[0].insertId)))
    .limit(1);

  return inserted[0];
}

export async function getConsultation(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(consultations)
    .where(eq(consultations.id, id));

  return result.length > 0 ? result[0] : undefined;
}

export async function getConsultationsForUser(
  userId: string,
  role: string
) {
  const db = await getDb();
  if (!db) return [];

  const condition =
    role === "artist"
      ? eq(consultations.artistId, userId)
      : eq(consultations.clientId, userId);

  return db
    .select()
    .from(consultations)
    .where(condition)
    .orderBy(desc(consultations.createdAt));
}

export async function updateConsultation(
  id: number,
  updates: Partial<InsertConsultation>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(consultations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(consultations.id, id));

  return getConsultation(id);
}

// ============================================================================
// Social Message Sync operations
// ============================================================================

export async function getSocialMessageSync(
  artistId: string,
  platform: "instagram" | "facebook"
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(socialMessageSync)
    .where(
      and(
        eq(socialMessageSync.artistId, artistId),
        eq(socialMessageSync.platform, platform)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSocialMessageSync(
  sync: InsertSocialMessageSync
) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getSocialMessageSync(
    sync.artistId,
    sync.platform as any
  );

  if (existing) {
    await db
      .update(socialMessageSync)
      .set({ ...sync, updatedAt: new Date() })
      .where(eq(socialMessageSync.id, existing.id));
    return getSocialMessageSync(sync.artistId, sync.platform as any);
  } else {
    const result = await db.insert(socialMessageSync).values(sync);
    const inserted = await db
      .select()
      .from(socialMessageSync)
      .where(eq(socialMessageSync.id, Number(result[0].insertId)))
      .limit(1);
    return inserted[0];
  }
}

export async function getAllSocialMessageSyncs(artistId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(socialMessageSync)
    .where(eq(socialMessageSync.artistId, artistId));
}



export async function getPendingAppointmentsByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.conversationId, conversationId),
        eq(appointments.status, "pending")
      )
    );
}

export async function confirmAppointments(conversationId: number, paymentProof?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    status: "confirmed",
    depositPaid: true,
    confirmationSent: false, // Will be set to true after notification is sent
    updatedAt: new Date(),
  };
  
  if (paymentProof) {
    updateData.paymentProof = paymentProof;
  }
  
  return db
    .update(appointments)
    .set(updateData)
    .where(
      and(
        eq(appointments.conversationId, conversationId),
        eq(appointments.status, "pending")
      )
    );
}



// Notification Settings Functions
export async function getNotificationSettings(userId: string) {
  try {
    const [settings] = await db
      .select()
      .from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId))
      .limit(1);
    
    return settings || null;
  } catch (error) {
    console.error("Error getting notification settings:", error);
    throw error;
  }
}

export async function upsertNotificationSettings(userId: string, settings: any) {
  try {
    // Check if settings exist
    const existing = await getNotificationSettings(userId);
    
    if (existing) {
      // Update existing settings
      await db
        .update(schema.notificationSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(schema.notificationSettings.userId, userId));
      
      return await getNotificationSettings(userId);
    } else {
      // Insert new settings
      await db.insert(schema.notificationSettings).values({
        userId,
        ...settings,
      });
      
      return await getNotificationSettings(userId);
    }
  } catch (error) {
    console.error("Error upserting notification settings:", error);
    throw error;
  }
}

