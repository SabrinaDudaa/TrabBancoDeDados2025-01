import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    host: '26.204.132.144',
    port: 54321,
    user: 'postgres',
    password: '1234',
    database: 'db'
});

export default pool;
