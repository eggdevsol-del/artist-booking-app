import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runStartupMigrations() {
  console.log("🔄 Running startup migrations...");

  const connection = await mysql.createConnection(ENV.DATABASE_URL);

  try {
    // Check if client_notes table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'client_notes'"
    );

    if (Array.isArray(tables) && tables.length === 0) {
      console.log("📝 Creating client_notes table...");
      
      const migrationSQL = readFileSync(
        join(__dirname, "migrations", "create-client-notes.sql"),
        "utf-8"
      );

      await connection.query(migrationSQL);
      console.log("✅ client_notes table created successfully!");
    } else {
      console.log("✅ client_notes table already exists");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Don't throw - we don't want to prevent the app from starting
  } finally {
    await connection.end();
  }
}

// Export for use in server startup
export { runStartupMigrations };

