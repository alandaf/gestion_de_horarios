import { db } from "./src/db.js";

async function run() {
    console.log("Dropping tables...");
    await db.query("SET FOREIGN_KEY_CHECKS = 0;");
    await db.query("DROP TABLE IF EXISTS horarios;");
    await db.query("DROP TABLE IF EXISTS bloques_horarios;");
    await db.query("DROP TABLE IF EXISTS salas;");
    await db.query("DROP TABLE IF EXISTS asignaturas;");
    await db.query("DROP TABLE IF EXISTS profesores;");
    await db.query("DROP TABLE IF EXISTS cursos;");
    await db.query("DROP TABLE IF EXISTS carreras;");
    await db.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Tables dropped.");
    process.exit(0);
}

run();
