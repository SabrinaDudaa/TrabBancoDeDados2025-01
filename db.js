import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 54321,
  user: 'postgres',
  password: '1234',
  database: 'postgres',
});

export default pool;
