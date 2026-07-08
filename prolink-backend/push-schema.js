require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

async function fixDB() {
  const config = parse(process.env.DATABASE_URL);
  const poolConfig = {
    user: config.user,
    password: String(config.password),
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: { rejectUnauthorized: false }
  };
  const pool = new Pool(poolConfig);
  try {
    let sql = fs.readFileSync('recreate.sql', 'utf16le');
    // Strip dotenvx logs and any garbage before the actual SQL
    const firstCreate = sql.indexOf('-- Create');
    if (firstCreate !== -1) {
      sql = sql.substring(firstCreate);
    }
    console.log("Dropping existing schema...");
    await pool.query('DROP SCHEMA IF EXISTS "public" CASCADE; CREATE SCHEMA "public";');
    
    console.log("Applying recreate.sql...");
    await pool.query(sql);
    console.log("Database schema fully synced!");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
fixDB();
