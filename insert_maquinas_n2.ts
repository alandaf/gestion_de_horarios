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

    const cursoNombre = "Formación Máquinas Nivel 2 - 2026-1";

    const scheduleData = [
        // LUNES
        { dia: 'LUNES', inicio: '14:15', fin: '15:00', asig: 'Matemática Aplicada', prof: 'Ernesto Godoy', sala: '103' },
        { dia: 'LUNES', inicio: '15:00', fin: '15:45', asig: 'Matemática Aplicada', prof: 'Ernesto Godoy', sala: '103' },
        { dia: 'LUNES', inicio: '16:00', fin: '16:45', asig: 'Matemática Aplicada', prof: 'Ernesto Godoy', sala: '103' },
        { dia: 'LUNES', inicio: '16:45', fin: '17:30', asig: 'Matemática Aplicada', prof: 'Ernesto Godoy', sala: '103' },
        { dia: 'LUNES', inicio: '17:45', fin: '18:30', asig: 'Motores Diesel', prof: 'Jaime Vizcarra', sala: '103' },
        { dia: 'LUNES', inicio: '18:30', fin: '19:15', asig: 'Motores Diesel', prof: 'Jaime Vizcarra', sala: '103' },

        // MARTES
        { dia: 'MARTES', inicio: '14:15', fin: '15:00', asig: 'Equip Sistemas Aux', prof: 'German Kreisel', sala: '103' },
        { dia: 'MARTES', inicio: '15:00', fin: '15:45', asig: 'Equip Sistemas Aux', prof: 'German Kreisel', sala: '103' },
        { dia: 'MARTES', inicio: '16:00', fin: '16:45', asig: 'Equip Sistemas Aux', prof: 'German Kreisel', sala: '103' },
        { dia: 'MARTES', inicio: '16:45', fin: '17:30', asig: 'Equip Sistemas Aux', prof: 'German Kreisel', sala: '103' },
        { dia: 'MARTES', inicio: '17:45', fin: '18:30', asig: 'Motores Diesel', prof: 'Jaime Vizcarra', sala: '103' },
        { dia: 'MARTES', inicio: '18:30', fin: '19:15', asig: 'Motores Diesel', prof: 'Jaime Vizcarra', sala: '103' },

        // MIERCOLES
        { dia: 'MIÉRCOLES', inicio: '14:15', fin: '15:00', asig: 'Electronica', prof: 'R. Toro', sala: '103' },
        { dia: 'MIÉRCOLES', inicio: '15:00', fin: '15:45', asig: 'Electronica', prof: 'R. Toro', sala: '103' },
        { dia: 'MIÉRCOLES', inicio: '16:00', fin: '16:45', asig: 'Mecánica', prof: 'Plaza', sala: '103' },
        { dia: 'MIÉRCOLES', inicio: '16:45', fin: '17:30', asig: 'Mecánica', prof: 'M.Plaza', sala: '103' },
        { dia: 'MIÉRCOLES', inicio: '17:45', fin: '18:30', asig: 'Mecánica', prof: 'M.Plaza', sala: '103' },
        { dia: 'MIÉRCOLES', inicio: '18:30', fin: '19:15', asig: 'Mecánica', prof: 'M.Plaza', sala: '103' },

        // JUEVES
        { dia: 'JUEVES', inicio: '14:15', fin: '15:00', asig: 'Ingles Operation Máquinas', prof: 'K. Scudery', sala: '103' },
        { dia: 'JUEVES', inicio: '15:00', fin: '15:45', asig: 'Ingles Operation Máquinas', prof: 'K. Scudery', sala: '103' },
        { dia: 'JUEVES', inicio: '16:00', fin: '16:45', asig: 'Ingles Operation Máquinas', prof: 'K. Scudery', sala: '103' },
        { dia: 'JUEVES', inicio: '16:45', fin: '17:30', asig: 'Ingles Operation Máquinas', prof: 'K. Scudery', sala: '103' },

        // VIERNES
        { dia: 'VIERNES', inicio: '14:15', fin: '15:00', asig: 'Electronica', prof: 'R. Toro', sala: '103' },
        { dia: 'VIERNES', inicio: '15:00', fin: '15:45', asig: 'Electronica', prof: 'R. Toro', sala: '103' },
        { dia: 'VIERNES', inicio: '16:00', fin: '16:45', asig: 'Generación y Distribución Eléct.', prof: 'R. Toro', sala: '103' },
        { dia: 'VIERNES', inicio: '16:45', fin: '17:30', asig: 'Generación y Distribución Eléct.', prof: 'R. Toro', sala: '103' },
        { dia: 'VIERNES', inicio: '17:45', fin: '18:30', asig: 'Generación y Distribución Eléct.', prof: 'R. Toro', sala: '103' },
        { dia: 'VIERNES', inicio: '18:30', fin: '19:15', asig: 'Generación y Distribución Eléct.', prof: 'R. Toro', sala: '103' },
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
        console.log(`Datos del curso "${cursoNombre}" insertados correctamente.`);
    } catch (err) {
        await connection.rollback();
        console.error("Error al insertar datos:", err);
    } finally {
        await connection.end();
    }
}

run();
