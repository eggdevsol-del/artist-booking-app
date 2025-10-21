import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple database initialization script
 * Runs the complete schema SQL file to set up all tables
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

    // Read the complete schema file
    const schemaPath = path.join(__dirname, 'migrations', 'complete-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`[DB Init] Schema file not found: ${schemaPath}`);
      return;
    }

    const sql = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[DB Init] Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await connection.query(statement);
        } catch (error: any) {
          // Ignore errors for constraints that might already exist
          if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
            console.log(`[DB Init] Skipping duplicate constraint (${i + 1}/${statements.length})`);
            continue;
          }
          console.error(`[DB Init] Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
          // Don't throw - continue with other statements
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
  }
}

// When run directly (not imported), execute initialization
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('[DB Init] Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[DB Init] Database initialization failed:', error);
      process.exit(1);
    });
}

