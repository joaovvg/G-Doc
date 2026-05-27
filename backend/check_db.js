import { Pool } from 'pg';
import fs from 'fs';

const env = fs.existsSync('.env')
  ? Object.fromEntries(
      fs
        .readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split('='))
    )
  : {};

const pool = new Pool({ connectionString: env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gdoc' });

(async () => {
  try {
    const result = await pool.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('organizational_units', 'doc_types')
       ORDER BY table_name, ordinal_position`
    );
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
})();
