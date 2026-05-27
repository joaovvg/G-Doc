import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gdoc' });

(async () => {
    try {
        const res = await pool.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            ORDER BY table_name, ordinal_position;
        `);
        
        const res2 = await pool.query(`
            SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name 
            FROM information_schema.table_constraints tc 
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public' AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY');
        `);
        
        fs.writeFileSync('check.json', JSON.stringify({ columns: res.rows, constraints: res2.rows }, null, 2));
    } catch(e) {
        fs.writeFileSync('check.json', JSON.stringify({ error: e.message }));
    } finally {
        pool.end();
    }
})();
