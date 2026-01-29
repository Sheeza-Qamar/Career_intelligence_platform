// backend/db.js
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    // WARNING: Disabled strict certificate verification for local development with Aiven.
    // For production, configure the CA certificate and set rejectUnauthorized: true.
    rejectUnauthorized: false,
  },
});

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
  connection.query('SELECT DATABASE() AS db', (e, rows) => {
    if (!e && rows && rows[0]) {
      console.log('📂 Using database:', rows[0].db);
    }
  });
});

module.exports = connection;
