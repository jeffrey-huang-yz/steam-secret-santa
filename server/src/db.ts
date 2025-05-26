import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export async function query<T = any>(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(sql, params);
    return rows as T[];
  } finally {
    client.release();
  }
}
