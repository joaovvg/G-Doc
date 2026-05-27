import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Delete tudo que depende da unidade (mesmo que cascade já faça, forçamos)
  await client.query("DELETE FROM organizational_units WHERE id = '60606060-6060-6060-6060-606060606060'");
  await client.query('COMMIT');
  console.log('✅ Deleted.');
  const res = await client.query("SELECT id, name, is_primary FROM organizational_units ORDER BY name");
  console.log('Unidades restantes:', JSON.stringify(res.rows, null, 2));
} catch (e) {
  await client.query('ROLLBACK');
  console.error('❌', e.message);
} finally {
  client.release();
  await pool.end();
}
