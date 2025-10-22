import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  console.log("[Migration] Starting file_storage table migration...");
  
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    
    // Read and execute the migration SQL
    const migrationSQL = readFileSync(
      join(__dirname, "migrations", "create-file-storage.sql"),
      "utf-8"
    );
    
    console.log("[Migration] Executing SQL...");
    await connection.execute(migrationSQL);
    
    console.log("[Migration] ✓ file_storage table created successfully");
    
    // Verify table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'file_storage'"
    );
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log("[Migration] ✓ Table verified");
    } else {
      console.error("[Migration] ✗ Table verification failed");
    }
    
    await connection.end();
    console.log("[Migration] Complete!");
  } catch (error) {
    console.error("[Migration] Error:", error);
    process.exit(1);
  }
}

runMigration();

