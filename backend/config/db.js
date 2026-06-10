const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool for better connection management
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set SSL mode for Neon (required for cloud databases)
  ssl: {
    rejectUnauthorized: false
  }
});

// Handle pool connection errors
pool.on('error', (err) => {
  console.error('❌ Unexpected connection pool error:', err);
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL Database:', err);
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to Neon PostgreSQL Database');
  release();
});

// Export pool for queries
module.exports = pool;
