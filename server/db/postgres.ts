import pkg from 'pg';
const { Pool } = pkg;
import { log } from '../vite';

// Configuração da conexão com o PostgreSQL usando variáveis de ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testar a conexão com o banco de dados
pool.connect()
  .then(() => {
    log('Conexão com PostgreSQL estabelecida com sucesso', 'postgres');
  })
  .catch((err) => {
    console.error('Erro ao conectar com PostgreSQL:', err);
  });

// Função helper para executar queries
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    log(`Executed query: ${text} - ${duration}ms`, 'postgres');
    return res;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

export { pool };