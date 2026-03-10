import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
async function run() {
    const conn = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT) });
    const [salas] = await conn.query('SELECT * FROM salas ORDER BY id DESC LIMIT 10');
    console.log("SALAS:", salas);
    const [profes] = await conn.query('SELECT * FROM profesores ORDER BY id DESC LIMIT 10');
    console.log("PROFES:", profes);
    const [asig] = await conn.query('SELECT * FROM asignaturas ORDER BY id DESC LIMIT 10');
    console.log("ASIGNATURAS:", asig);
    await conn.end();
}
run().catch(console.error);
