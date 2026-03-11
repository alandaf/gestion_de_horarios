import { db } from './src/db.js';
import fs from 'fs';

async function dumpDB() {
  try {
    const tables = ['carreras', 'cursos', 'profesores', 'asignaturas', 'salas', 'bloques_horarios', 'horarios'];
    let sql = `-- Database Dump for AcademiaSync\n\n`;
    
    // Disable foreign key checks for clean import
    sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const table of tables) {
      const [rows]: any = await db.query(`SELECT * FROM ${table}`);
      
      sql += `-- Data for table ${table}\n`;
      sql += `TRUNCATE TABLE ${table};\n`;
      
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
        const values = rows.map((row: any) => {
          const val = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          return `(${val})`;
        }).join(',\n');
        
        sql += `INSERT INTO ${table} (${columns}) VALUES\n${values};\n\n`;
      }
    }

    sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    fs.writeFileSync('database_dump.sql', sql);
    console.log('Database dump created: database_dump.sql');
    process.exit(0);
  } catch (err) {
    console.error('Error dumping database:', err);
    process.exit(1);
  }
}

dumpDB();
