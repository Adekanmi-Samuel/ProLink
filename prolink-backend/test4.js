require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

async function test() {
  try {
    const config = parse(process.env.DATABASE_URL);
    const poolConfig = {
      user: config.user,
      password: String(config.password),
      host: config.host,
      port: config.port,
      database: config.database,
      ssl: { rejectUnauthorized: false }
    };
    
    console.log('Connecting with explicit string password...');
    const pool = new Pool(poolConfig);
    const res = await pool.query('SELECT 1 as result');
    console.log('Query result:', res.rows);
    await pool.end();
  } catch(e) {
    console.error(e);
  }
}
test();
