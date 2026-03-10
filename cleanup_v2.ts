import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function cleanup() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
    });

    try {
        // Delete specifically ID 199
        await db.query('DELETE FROM horarios WHERE id = 199');
        console.log('ID 199 eliminado.');

        // Check if there are any other out-of-place classes
        // Looking at the seeder scripts, most classes start from 14:15 (Bloque 1)
        // Except Sábado (Bloque 7-11).
        // So any class on Lunes-Viernes with bloque_id >= 7 is likely a test.
        const [others] = await db.query('SELECT id FROM horarios WHERE dia_semana NOT IN ("SÁBADO", "Sábado") AND bloque_id >= 7');
        if ((others as any[]).length > 0) {
            for (const row of (others as any[])) {
                await db.query('DELETE FROM horarios WHERE id = ?', [row.id]);
                console.log(`Clase extra (ID: ${row.id}) eliminada.`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

cleanup();
