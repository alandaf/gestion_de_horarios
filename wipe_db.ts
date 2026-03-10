import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    });

    console.log("Conectado a la base de datos. Limpiando tablas...");

    // Disable foreign key checks temporarily to allow truncating
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate tables to reset IDs back to 1
    await conn.query('TRUNCATE TABLE horarios');
    await conn.query('TRUNCATE TABLE salas');
    await conn.query('TRUNCATE TABLE profesores');
    await conn.query('TRUNCATE TABLE asignaturas');
    await conn.query('TRUNCATE TABLE bloques_horarios');
    await conn.query('TRUNCATE TABLE cursos');

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log("Todas las tablas han sido vaciadas con éxito.");
    await conn.end();
}

run().catch(console.error);
