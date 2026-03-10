import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "academia_sync",
};

// Create the connection pool
const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDB() {
  try {
    // First connect without database to create it if it doesn't exist
    const initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await initialConnection.end();

    // Now initialize tables using the pool
    await db.query(`
      CREATE TABLE IF NOT EXISTS carreras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        carrera_id INT,
        FOREIGN KEY(carrera_id) REFERENCES carreras(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS profesores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS asignaturas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS salas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS bloques_horarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hora_inicio VARCHAR(10) NOT NULL,
        hora_fin VARCHAR(10) NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS horarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curso_id INT NOT NULL,
        asignatura_id INT NOT NULL,
        profesor_id INT NOT NULL,
        sala_id INT NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        bloque_id INT NOT NULL,
        FOREIGN KEY(curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
        FOREIGN KEY(asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE,
        FOREIGN KEY(profesor_id) REFERENCES profesores(id) ON DELETE CASCADE,
        FOREIGN KEY(sala_id) REFERENCES salas(id) ON DELETE CASCADE,
        FOREIGN KEY(bloque_id) REFERENCES bloques_horarios(id) ON DELETE CASCADE
      )
    `);

    // Seed initial data if empty
    const [carrerasRows]: any = await db.query("SELECT COUNT(*) as count FROM carreras");
    if (carrerasRows[0].count === 0) {
      await db.query("INSERT INTO carreras (nombre) VALUES ('Ingeniería Marítima'), ('Administración Portuaria')");

      await db.query("INSERT INTO cursos (nombre, carrera_id) VALUES ('Nivel 1', 1), ('Nivel 2', 1), ('Nivel 1', 2)");

      await db.query("INSERT INTO profesores (nombre) VALUES ('Rodolfo Estay'), ('María González'), ('Carlos Pérez')");

      await db.query("INSERT INTO asignaturas (nombre) VALUES ('Legislación Marítima Nacional'), ('Cálculo I'), ('Física General')");

      await db.query("INSERT INTO salas (nombre) VALUES ('106'), ('107'), ('Laboratorio A')");

      await db.query(`
        INSERT INTO bloques_horarios (hora_inicio, hora_fin) VALUES 
        ('08:30', '09:15'),
        ('09:15', '10:00'),
        ('10:15', '11:00'),
        ('11:00', '11:45'),
        ('14:15', '15:00'),
        ('15:00', '15:45')
      `);

      await db.query(`
        INSERT INTO horarios (curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id)
        VALUES (1, 1, 1, 1, 'Lunes', 5)
      `);
    }
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Call initialization
initDB();

export { db };
