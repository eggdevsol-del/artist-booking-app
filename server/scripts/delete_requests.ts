
import { db } from "../db";
import { consultations, eq } from "../../drizzle/schema";

async function main() {
    console.log("Deleting all pending consultation requests...");

    try {
        const result = await db.delete(consultations).where(eq(consultations.status, 'pending'));
        console.log(`Deleted pending consultations.`);
    } catch (error) {
        console.error("Error deleting consultations:", error);
    }

    process.exit(0);
}

main();
