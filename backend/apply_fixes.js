import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente rudimentarmente do .env
const envPath = path.join(process.cwd(), '.env');
const env = fs.existsSync(envPath)
  ? Object.fromEntries(
      fs.readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
           let i = line.indexOf('=');
           return [line.substring(0, i), line.substring(i + 1)];
        })
    )
  : {};

const dbUrl = env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gdoc';
const pool = new Pool({ connectionString: dbUrl });

(async () => {
  try {
    console.log('🔗 Conectando ao banco de dados:', dbUrl.split('@')[1] || dbUrl);
    
    const sqlPath = path.join(process.cwd(), 'db', 'fix_tables.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo db/fix_tables.sql não encontrado.');
    }

    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Executando script de correção de tabelas (fix_tables.sql) para injetar CREATED_AT e UPDATED_AT...');
    
    // Executa todo o script no banco
    const result = await pool.query(sqlScript);
    
    console.log('✅ Tabelas e chaves estrangeiras atualizadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error);
  } finally {
    await pool.end();
  }
})();
