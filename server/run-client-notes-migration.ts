import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";

async function runMigration() {
  console.log("🔄 Running client_notes table migration...");

  const connection = await mysql.createConnection(ENV.DATABASE_URL);

  try {
    const migrationSQL = readFileSync(
      join(__dirname, "migrations", "create-client-notes.sql"),
      "utf-8"
    );

    console.log("📝 Executing migration SQL...");
    await connection.query(migrationSQL);

    console.log("✅ client_notes table created successfully!");

    // Verify the table was created
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'client_notes'"
    );
    console.log("📊 Verification:", tables);

    // Show table structure
    const [structure] = await connection.query("DESCRIBE client_notes");
    console.log("🏗️  Table structure:", structure);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });

