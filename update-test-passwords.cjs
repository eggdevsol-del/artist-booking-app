require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateTestPasswords() {
  console.log('[Update] Connecting to database...');
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const password = 'password123';
  console.log('[Update] Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('[Update] Password hash:', hashedPassword.substring(0, 30) + '...');
  
  // Update artist account
  console.log('[Update] Updating artist@test.com...');
  const [artistResult] = await conn.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'artist@test.com']
  );
  console.log('[Update] Artist updated, affected rows:', artistResult.affectedRows);
  
  // Update client account
  console.log('[Update] Updating client@test.com...');
  const [clientResult] = await conn.execute(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, 'client@test.com']
  );
  console.log('[Update] Client updated, affected rows:', clientResult.affectedRows);
  
  // Verify the update
  console.log('[Update] Verifying passwords...');
  const [users] = await conn.execute(
    'SELECT email, password FROM users WHERE email IN (?, ?)',
    ['artist@test.com', 'client@test.com']
  );
  
  for (const user of users) {
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`[Update] ${user.email}: password valid = ${isValid}`);
  }
  
  await conn.end();
  console.log('[Update] Done!');
}

updateTestPasswords().catch(console.error);

