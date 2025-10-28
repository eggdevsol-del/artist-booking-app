import { readFileSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
// import { ENV } from "./_core/env";

async function runMigration() {
  console.log("🔄 Running client_content table migration...");

  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;
  console.log('📡 Connecting to database:', databaseUrl ? 'URL found' : 'URL missing');
  const connection = await mysql.createConnection(databaseUrl!);

  try {
    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS client_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        artist_id VARCHAR(255) NOT NULL,
        file_key VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type ENUM('image', 'video') NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_client_artist (client_id, artist_id),
        INDEX idx_file_key (file_key)
      )
    `;

    console.log("📝 Executing migration SQL...");
    await connection.query(migrationSQL);

    console.log("✅ client_content table created successfully!");

    // Verify the table was created
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'client_content'"
    );
    console.log("📊 Verification:", tables);

    // Show table structure
    const [structure] = await connection.query("DESCRIBE client_content");
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

