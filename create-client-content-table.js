// Script to create client_content table in Railway MySQL database
import mysql2 from 'mysql2/promise';

async function createClientContentTable() {
  console.log('Connecting to database...');
  
  const connection = await mysql2.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Creating client_content table...');
    
    const createTableSQL = `
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
    
    await connection.execute(createTableSQL);
    console.log('✅ client_content table created successfully!');
    
    // Verify table structure
    const [rows] = await connection.execute('DESCRIBE client_content');
    console.log('\nTable structure:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

createClientContentTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

