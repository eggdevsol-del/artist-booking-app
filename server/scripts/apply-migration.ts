
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function applyMigration() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    const migrationFile = path.resolve(__dirname, '../../drizzle/0009_add_notification_outbox.sql');
    if (!fs.existsSync(migrationFile)) {
        console.error(`Migration file not found: ${migrationFile}`);
        process.exit(1);
    }

    console.log(`Applying migration: ${path.basename(migrationFile)}`);

    const connection = await mysql.createConnection(databaseUrl);

    try {
        const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
        const statements = sqlContent.split(';').filter(s => s.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                    console.log(`Executed: ${statement.substring(0, 50)}...`);
                } catch (e: any) {
                    if (e.message.includes('already exists')) {
                        console.log(`Table/Index already exists, skipping.`);
                    } else {
                        console.error(`Error executing statement: ${e.message}`);
                        throw e;
                    }
                }
            }
        }
        console.log('Migration applied successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

applyMigration();
