const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDrizzleFormat() {
  // Test with raw mysql2 to see the actual format
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== Testing mysql2 execute() return format ===\n');
  
  const result = await connection.execute('SELECT file_data, mime_type FROM file_storage LIMIT 1');
  
  console.log('1. typeof result:', typeof result);
  console.log('2. Array.isArray(result):', Array.isArray(result));
  console.log('3. result.length:', result.length);
  console.log('4. typeof result[0]:', typeof result[0]);
  console.log('5. Array.isArray(result[0]):', Array.isArray(result[0]));
  
  if (Array.isArray(result[0]) && result[0].length > 0) {
    console.log('6. result[0].length:', result[0].length);
    console.log('7. result[0][0] keys:', Object.keys(result[0][0]));
    console.log('8. result[0][0].file_data exists:', !!result[0][0].file_data);
    console.log('9. result[0][0].mime_type:', result[0][0].mime_type);
  }
  
  console.log('\n=== Correct access pattern ===');
  console.log('const [rows, fields] = await connection.execute(...)');
  console.log('const row = rows[0]');
  console.log('const data = row.file_data');
  
  await connection.end();
}

testDrizzleFormat().catch(console.error);
