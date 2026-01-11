import { desc, eq } from "drizzle-orm";
import { consultations, InsertConsultation } from "../../drizzle/schema";
import { getDb } from "./core";

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
