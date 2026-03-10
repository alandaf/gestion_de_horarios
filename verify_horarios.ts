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
        const [rows]: any = await connection.query(`
      SELECT 
        h.id,
        c.nombre as curso,
        a.nombre as asignatura,
        p.nombre as profesor,
        s.nombre as sala,
        h.dia_semana,
        bh.hora_inicio,
        bh.hora_fin
      FROM horarios h
      JOIN cursos c ON h.curso_id = c.id
      JOIN asignaturas a ON h.asignatura_id = a.id
      JOIN profesores p ON h.profesor_id = p.id
      JOIN salas s ON h.sala_id = s.id
      JOIN bloques_horarios bh ON h.bloque_id = bh.id
    `);

        console.log("HORARIOS EN DB:");
        console.log(JSON.stringify(rows, null, 2));
        console.log(`Total: ${rows.length} horarios found.`);
    } catch (err) {
        console.error("Error al consultar horarios:", err);
    } finally {
        await connection.end();
    }
}

run();
