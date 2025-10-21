import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database initialization script using Drizzle migration files
 * Runs all migration SQL files to set up tables
 */
export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('[DB Init] DATABASE_URL not set, skipping database initialization');
    return;
  }

  console.log('[DB Init] Starting database initialization...');
  
  let connection;
  try {
    connection = await mysql.createConnection(databaseUrl);
    console.log('[DB Init] Connected to database');

    // Check if tables already exist
    const [tables] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );
    
    const tablesExist = (tables as any)[0].count > 0;
    
    if (tablesExist) {
      console.log('[DB Init] Tables already exist, skipping initialization');
      await connection.end();
      return;
    }

    console.log('[DB Init] Database is empty, creating tables...');

    // Find the drizzle migration directory
    // In production (dist), drizzle folder is copied to dist/drizzle
    // In development, it's at ../drizzle relative to server
    let drizzlePath = path.join(__dirname, '..', 'drizzle');
    
    // If running from dist folder, drizzle is in dist/drizzle
    if (__dirname.includes('/dist')) {
      drizzlePath = path.join(__dirname, 'drizzle');
    }
    
    console.log(`[DB Init] Looking for migrations in: ${drizzlePath}`);
    
    if (!fs.existsSync(drizzlePath)) {
      console.error(`[DB Init] Drizzle migrations directory not found: ${drizzlePath}`);
      return;
    }

    // Get all .sql migration files and sort them
    const migrationFiles = fs.readdirSync(drizzlePath)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`[DB Init] Found ${migrationFiles.length} migration files`);

    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`[DB Init] Running migration: ${file}`);
      const filePath = path.join(drizzlePath, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            await connection.query(statement);
          } catch (error: any) {
            // Ignore errors for constraints that might already exist
            if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
              console.log(`[DB Init] Skipping duplicate constraint in ${file}`);
              continue;
            }
            console.error(`[DB Init] Error in ${file}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
            // Don't throw - continue with other statements
          }
        }
      }
    }

    // Verify tables were created
    const [finalTables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    
    const tableNames = (finalTables as any[]).map((t: any) => t.table_name || t.TABLE_NAME);
    console.log(`[DB Init] ✓ Successfully created ${tableNames.length} tables:`, tableNames.join(', '));

  } catch (error: any) {
    console.error('[DB Init] Failed to initialize database:', error.message);
    // Don't throw - let the app continue
  } finally {
    if (connection) {
      await connection.end();
    }
    console.log('[DB Init] Database initialization complete');
  }
}

// When run directly (not imported), execute initialization
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('[DB Init] Standalone execution complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[DB Init] Standalone execution failed:', error);
      process.exit(1);
    });
}

