import pg from 'pg';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

const runSqlFile = async (relativePath) => {
  const absolutePath = path.resolve(__dirname, relativePath);
  const script = await readFile(absolutePath, 'utf-8');
  if (!script.trim()) return;
  await pool.query(script);
};

export const initializeDatabase = async () => {
  await runSqlFile('../db/schema.sql');
  await runSqlFile('../db/fix_tables.sql');
};

export const withTransaction = async (handler) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
