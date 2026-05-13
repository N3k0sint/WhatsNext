const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database directly
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
});

console.log('====================================================');
console.log('   SECURE PASSWORD VERIFICATION (OWASP ASVS V3)   ');
console.log('====================================================');
console.log('This script queries the database directly to prove');
console.log('that passwords are NOT stored in plaintext and are');
console.log('securely hashed using bcrypt.\n');

const query = `SELECT id, username, password FROM Users`;

db.all(query, [], (err, rows) => {
  if (err) {
    throw err;
  }
  
  if (rows.length === 0) {
    console.log('No users found in the database. Register a user first!');
  } else {
    rows.forEach((row) => {
      console.log(`User ID : ${row.id}`);
      console.log(`Username: ${row.username}`);
      console.log(`Password: ${row.password}`);
      
      // Verify bcrypt format
      if (row.password && (row.password.startsWith('$2a$') || row.password.startsWith('$2b$'))) {
        console.log(`Status  : [SECURE] Valid bcrypt hash detected.`);
      } else {
        console.log(`Status  : [VULNERABLE] Password is not hashed correctly!`);
      }
      console.log('----------------------------------------------------');
    });
  }
  
  db.close();
});
