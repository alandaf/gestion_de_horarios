import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
    });

    try {
        const [rows] = await db.query('SELECT h.id, c.nombre as curso, a.nombre as asignatura, p.nombre as profesor, h.dia_semana, h.bloque_id FROM horarios h JOIN cursos c ON h.curso_id = c.id JOIN asignaturas a ON h.asignatura_id = a.id JOIN profesores p ON h.profesor_id = p.id ORDER BY h.id DESC LIMIT 10');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

check();
