/**
 * Setup script to create job_search_cache table
 * Run with: node scripts/setup-job-search-cache.js
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

async function setupCacheTable() {
  const connection = db.promise();
  
  try {
    console.log('📋 Reading migration file...');
    const migrationPath = path.join(__dirname, '../migrations/create_job_search_cache.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Creating job_search_cache table...');
    await connection.query(migrationSQL);
    
    console.log('✅ Successfully created job_search_cache table!');
    console.log('   Caching is now enabled for job searches.');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table job_search_cache already exists. No action needed.');
      process.exit(0);
    } else {
      console.error('❌ Error creating table:', error.message);
      process.exit(1);
    }
  }
}

setupCacheTable();
