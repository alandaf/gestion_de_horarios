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

    const cursoNombre = "2026-1 Curso especial Formación Puente - Nivel 1";

    const scheduleData = [
        // LUNES
        { dia: 'LUNES', inicio: '14:15', fin: '15:00', asig: 'Nav. Costera I', prof: 'Enrique Coloma', sala: '105' },
        { dia: 'LUNES', inicio: '15:00', fin: '15:45', asig: 'Nav. Costera I', prof: 'Enrique Coloma', sala: '105' },
        { dia: 'LUNES', inicio: '16:00', fin: '16:45', asig: 'Inglés Maniobra', prof: 'Karem Escudero', sala: '105' },
        { dia: 'LUNES', inicio: '16:45', fin: '17:30', asig: 'Inglés Maniobra', prof: 'Karem Escudero', sala: '105' },
        { dia: 'LUNES', inicio: '17:45', fin: '18:30', asig: 'Inglés Maniobra', prof: 'Karem Escudero', sala: '105' },
        { dia: 'LUNES', inicio: '18:30', fin: '19:15', asig: 'Inglés Maniobra', prof: 'Karem Escudero', sala: '105' },

        // MARTES
        { dia: 'MARTES', inicio: '14:15', fin: '15:00', asig: 'Legislación Marítima Nacional', prof: 'Manuel Moreno', sala: '106' },
        { dia: 'MARTES', inicio: '15:00', fin: '15:45', asig: 'Legislación Marítima Nacional', prof: 'Manuel Moreno', sala: '106' },
        { dia: 'MARTES', inicio: '16:00', fin: '16:45', asig: 'Guardia de Nav', prof: 'D. Apostolovski', sala: '106' },
        { dia: 'MARTES', inicio: '16:45', fin: '17:30', asig: 'Guardia de Nav', prof: 'D. Apostolovski', sala: '106' },
        { dia: 'MARTES', inicio: '17:45', fin: '18:30', asig: 'Guardia de Nav', prof: 'D. Apostolovski', sala: '106' },

        // MIERCOLES
        { dia: 'MIÉRCOLES', inicio: '16:00', fin: '16:45', asig: 'Matemática general', prof: 'Ernesto Godoy', sala: '106' },
        { dia: 'MIÉRCOLES', inicio: '16:45', fin: '17:30', asig: 'Matemática general', prof: 'Ernesto Godoy', sala: '106' },
        { dia: 'MIÉRCOLES', inicio: '17:45', fin: '18:30', asig: 'Matemática general', prof: 'Ernesto Godoy', sala: '106' },
        { dia: 'MIÉRCOLES', inicio: '18:30', fin: '19:15', asig: 'Matemática general', prof: 'Ernesto Godoy', sala: '106' },

        // JUEVES
        { dia: 'JUEVES', inicio: '14:15', fin: '15:00', asig: 'Equipos de Puente', prof: 'Carlos Beth', sala: '106' },
        { dia: 'JUEVES', inicio: '15:00', fin: '15:45', asig: 'Equipos de Puente', prof: 'Carlos Beth', sala: '106' },
        { dia: 'JUEVES', inicio: '16:00', fin: '16:45', asig: 'Equipos de Puente', prof: 'Carlos Beth', sala: '106' },
        { dia: 'JUEVES', inicio: '16:45', fin: '17:30', asig: 'Nav. Costera I', prof: 'Enrique Coloma', sala: '106' },
        { dia: 'JUEVES', inicio: '17:45', fin: '18:30', asig: 'Nav. Costera I', prof: 'Enrique Coloma', sala: '106' },
        { dia: 'JUEVES', inicio: '18:30', fin: '19:15', asig: 'Nav. Costera I', prof: 'Enrique Coloma', sala: '106' },

        // VIERNES
        { dia: 'VIERNES', inicio: '14:15', fin: '15:00', asig: 'Meteorología', prof: 'G. Vargas Castillo', sala: '106' },
        { dia: 'VIERNES', inicio: '15:00', fin: '15:45', asig: 'Meteorología', prof: 'G. Vargas Castillo', sala: '106' },
        { dia: 'VIERNES', inicio: '16:00', fin: '16:45', asig: 'Meteorología', prof: 'G. Vargas Castillo', sala: '106' },
        { dia: 'VIERNES', inicio: '16:45', fin: '17:30', asig: 'Familiarización Marítima', prof: 'Manuel Moreno', sala: '106' },

        // SABADO
        { dia: 'SÁBADO', inicio: '08:30', fin: '09:15', asig: 'Física General', prof: 'M. Plaza', sala: '106' },
        { dia: 'SÁBADO', inicio: '09:15', fin: '10:00', asig: 'Física General', prof: 'M. Plaza', sala: '106' },
        { dia: 'SÁBADO', inicio: '10:15', fin: '11:00', asig: 'Física General', prof: 'M. Plaza', sala: '106' },
        { dia: 'SÁBADO', inicio: '11:00', fin: '11:45', asig: 'Física General', prof: 'M. Plaza', sala: '106' },
        { dia: 'SÁBADO', inicio: '12:00', fin: '12:45', asig: 'Física General', prof: 'M. Plaza', sala: '106' }
    ];

    try {
        await connection.beginTransaction();

        // 1. Curso
        let [cursoRows]: any = await connection.query("SELECT id FROM cursos WHERE nombre = ?", [cursoNombre]);
        let cursoId;
        if (cursoRows.length > 0) {
            cursoId = cursoRows[0].id;
        } else {
            const [res]: any = await connection.query("INSERT INTO cursos (nombre, carrera_id) VALUES (?, 1)", [cursoNombre]);
            cursoId = res.insertId;
        }

        for (const item of scheduleData) {
            // 2. Bloque
            let [bloqueRows]: any = await connection.query("SELECT id FROM bloques_horarios WHERE hora_inicio = ? AND hora_fin = ?", [item.inicio, item.fin]);
            let bloqueId;
            if (bloqueRows.length > 0) {
                bloqueId = bloqueRows[0].id;
            } else {
                const [res]: any = await connection.query("INSERT INTO bloques_horarios (hora_inicio, hora_fin) VALUES (?, ?)", [item.inicio, item.fin]);
                bloqueId = res.insertId;
            }

            // 3. Asignatura
            let [asigRows]: any = await connection.query("SELECT id FROM asignaturas WHERE nombre = ?", [item.asig]);
            let asigId;
            if (asigRows.length > 0) {
                asigId = asigRows[0].id;
            } else {
                const [res]: any = await connection.query("INSERT INTO asignaturas (nombre) VALUES (?)", [item.asig]);
                asigId = res.insertId;
            }

            // 4. Profesor
            let [profRows]: any = await connection.query("SELECT id FROM profesores WHERE nombre = ?", [item.prof]);
            let profId;
            if (profRows.length > 0) {
                profId = profRows[0].id;
            } else {
                const [res]: any = await connection.query("INSERT INTO profesores (nombre) VALUES (?)", [item.prof]);
                profId = res.insertId;
            }

            // 5. Sala
            let [salaRows]: any = await connection.query("SELECT id FROM salas WHERE nombre = ?", [item.sala]);
            let salaId;
            if (salaRows.length > 0) {
                salaId = salaRows[0].id;
            } else {
                const [res]: any = await connection.query("INSERT INTO salas (nombre) VALUES (?)", [item.sala]);
                salaId = res.insertId;
            }

            // 6. Horario
            await connection.query(
                "INSERT INTO horarios (curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id) VALUES (?, ?, ?, ?, ?, ?)",
                [cursoId, asigId, profId, salaId, item.dia, bloqueId]
            );
        }

        await connection.commit();
        console.log("Datos de la imagen insertados correctamente.");
    } catch (err) {
        await connection.rollback();
        console.error("Error al insertar datos:", err);
    } finally {
        await connection.end();
    }
}

run();
