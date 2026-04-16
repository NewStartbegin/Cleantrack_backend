require('dotenv').config();
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleantrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('✗ Error connecting to database:', error.message);
    throw error;
  }
}

// Helper functions for async queries
async function run(sql, params = []) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(sql, params);
    connection.release();
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

async function get(sql, params = []) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    connection.release();
    return rows[0] || null;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

async function all(sql, params = []) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    connection.release();
    return rows || [];
  } catch (error) {
    console.error('Query error:', error.message);
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
