import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    });

    try {
        const [h]: any = await connection.query("SELECT COUNT(*) as count FROM horarios");
        const [c]: any = await connection.query("SELECT COUNT(*) as count FROM cursos");
        const [p]: any = await connection.query("SELECT COUNT(*) as count FROM profesores");
        const [a]: any = await connection.query("SELECT COUNT(*) as count FROM asignaturas");
        const [s]: any = await connection.query("SELECT COUNT(*) as count FROM salas");
        const [b]: any = await connection.query("SELECT COUNT(*) as count FROM bloques_horarios");

        console.log("STATS:");
        console.log({
            horarios: h[0].count,
            cursos: c[0].count,
            profesores: p[0].count,
            asignaturas: a[0].count,
            salas: s[0].count,
            bloques: b[0].count
        });

        const [bloques]: any = await connection.query("SELECT * FROM bloques_horarios");
        console.log("BLOQUES:", bloques);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await connection.end();
    }
}

run();
