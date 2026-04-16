require('dotenv').config();
const mysql = require('mysql2/promise');

// VALIDASI ENV (WAJIB)
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error("❌ Database ENV tidak lengkap!");
  process.exit(1);
}

// Create connection pool (TANPA fallback!)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    console.log('✅ Connected to MySQL database');
    console.log('📍 Host:', process.env.DB_HOST);
    console.log('📦 Database:', process.env.DB_NAME);

    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    process.exit(1);
  }
}

// Helper: run (INSERT/UPDATE/DELETE)
async function run(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

// Helper: get (1 row)
async function get(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

// Helper: all (many rows)
async function all(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows || [];
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  run,
  get,
  all,
  initializeDatabase,
};