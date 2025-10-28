// One-time script to create client_notes table
// Run with: node create-client-notes-table-now.js

import mysql from 'mysql2/promise';

// Get DATABASE_URL from environment or Railway
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  console.error('Please set it in Railway Variables or pass it as an argument');
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS client_notes (
  id VARCHAR(255) PRIMARY KEY,
  artist_id VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_artist_client (artist_id, client_id),
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function createTable() {
  console.log('🔄 Connecting to database...');
  console.log('📍 Database URL:', DATABASE_URL.replace(/:[^:]*@/, ':****@'));
  
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Connected to database');

    console.log('📝 Creating client_notes table...');
    await connection.query(SQL);
    console.log('✅ client_notes table created successfully!');

    // Verify the table was created
    console.log('\n📊 Verifying table creation...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'client_notes'");
    if (tables.length > 0) {
      console.log('✅ Table verified: client_notes exists');
      
      // Show table structure
      const [structure] = await connection.query('DESCRIBE client_notes');
      console.log('\n🏗️  Table structure:');
      console.table(structure);
    } else {
      console.error('❌ Table verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

createTable()
  .then(() => {
    console.log('\n✅ Done! The client_notes table is ready.');
    console.log('You can now save notes in the app!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create table');
    process.exit(1);
  });

