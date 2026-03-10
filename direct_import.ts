import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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

    const files = [
        '2026 -1 CCEE Cubierta  28.01.26.xlsx',
        '2026 -1 CCEE Maquinas 28.01.26.xlsx'
    ];

    for (const file of files) {
        console.log(`Procesando archivo: ${file}...`);
        const fileBuffer = fs.readFileSync(file);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });

        await connection.beginTransaction();
        let clasesImportadas = 0;

        const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

        function excelTimeToString(t: any): string {
            if (typeof t === 'number') {
                const totalMinutes = Math.round(t * 24 * 60);
                const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                const mm = (totalMinutes % 60).toString().padStart(2, '0');
                return `${hh}:${mm}`;
            }
            return String(t || '');
        }

        function parseTimeBox(text: string) {
            if (!text) return null;
            let clean = text.replace(/a/g, '-').replace(/\s+/g, '');
            let parts = clean.split('-');
            if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 5) {
                return { start: parts[0], end: parts[1] };
            }
            return null;
        }

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];

            // 1. Resolve merged cells
            const rangeStr = sheet['!ref'];
            if (!rangeStr) continue;
            const range = xlsx.utils.decode_range(rangeStr);
            const matrix: any[][] = [];

            for (let R = range.s.r; R <= range.e.r; ++R) {
                matrix[R] = [];
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
                    const cell = sheet[cellRef];
                    matrix[R][C] = cell ? cell.v : null;
                }
            }

            if (sheet['!merges']) {
                for (const merge of sheet['!merges']) {
                    const startCell = xlsx.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
                    const val = sheet[startCell] ? sheet[startCell].v : null;
                    for (let r = merge.s.r; r <= merge.e.r; r++) {
                        for (let c = merge.s.c; c <= merge.e.c; c++) {
                            matrix[r][c] = val;
                        }
                    }
                }
            }

            // 2. Find Header Row
            let headerRowIdx = -1;
            for (let r = 0; r < matrix.length; r++) {
                const rowStr = matrix[r].join("").toUpperCase();
                if (rowStr.includes('LUNES') && rowStr.includes('MARTES')) {
                    headerRowIdx = r;
                    break;
                }
            }

            if (headerRowIdx === -1) continue;

            // 3. Get Course ID
            let cursoId: number;
            const [cursoRows] = await connection.query<RowDataPacket[]>("SELECT id FROM cursos WHERE nombre = ?", [sheetName.trim()]);
            if (cursoRows.length > 0) {
                cursoId = cursoRows[0].id;
            } else {
                const [info] = await connection.query<ResultSetHeader>("INSERT INTO cursos (nombre, carrera_id) VALUES (?, 1)", [sheetName.trim()]);
                cursoId = info.insertId;
            }

            // 4. Map columns
            const dayCols: Record<string, number> = {};
            const headers = matrix[headerRowIdx];
            let timeColIdx = 1;
            let pIdColIdx = 0; // Usually column 0 is Periodo

            for (let c = 0; c < headers.length; c++) {
                const h = headers[c];
                if (typeof h === 'string') {
                    const upperH = h.toUpperCase().trim();
                    for (const day of DAYS) {
                        if (upperH === day || upperH.includes(day)) {
                            dayCols[day] = c;
                        }
                    }
                    if (upperH.includes('HORA')) {
                        timeColIdx = c;
                    }
                    if (upperH.includes('PERIODO') || upperH.includes('N°')) {
                        pIdColIdx = c;
                    }
                }
            }

            // 5. Build classes by chunking rows sharing the same Periodo identifier
            const blocks: any[][] = [];
            let currentBlockId = null;
            let currentBlockRows: any[] = [];

            for (let r = headerRowIdx + 1; r < matrix.length; r++) {
                const pId = matrix[r][pIdColIdx];

                // Check if row is completely empty
                const isEmptyRow = matrix[r].every(v => v === null || v === '');
                if (isEmptyRow) continue;

                if (pId !== currentBlockId && pId !== null && String(pId).trim() !== '') {
                    // New block
                    if (currentBlockRows.length > 0) {
                        blocks.push(currentBlockRows);
                    }
                    currentBlockId = pId;
                    currentBlockRows = [matrix[r]];
                } else {
                    // Same block
                    currentBlockRows.push(matrix[r]);
                }
            }
            if (currentBlockRows.length > 0) blocks.push(currentBlockRows);

            for (const blockRows of blocks) {
                // Find time string in this block from timeColIdx or adjacent
                let rawTimeParts: string[] = [];
                for (let r = 0; r < blockRows.length; r++) {
                    const tVal = blockRows[r][timeColIdx];
                    if (tVal) {
                        const str = excelTimeToString(tVal).trim();
                        if (rawTimeParts.length === 0 || rawTimeParts[rawTimeParts.length - 1] !== str) {
                            rawTimeParts.push(str);
                        }
                    }
                }

                let timeStrCombined = rawTimeParts.join(" ").replace(/\s+a\s+/g, " a ");
                const parsedTime = parseTimeBox(timeStrCombined);

                if (!parsedTime) {
                    continue; // Can't parse time
                }

                // Get or create Bloque
                let bloqueId: number;
                const [bloqueRows] = await connection.query<RowDataPacket[]>(
                    "SELECT id FROM bloques_horarios WHERE hora_inicio = ? AND hora_fin = ?",
                    [parsedTime.start, parsedTime.end]
                );
                if (bloqueRows.length > 0) {
                    bloqueId = bloqueRows[0].id;
                } else {
                    const [info] = await connection.query<ResultSetHeader>(
                        "INSERT INTO bloques_horarios (hora_inicio, hora_fin) VALUES (?, ?)",
                        [parsedTime.start, parsedTime.end]
                    );
                    bloqueId = info.insertId;
                }

                // For each day column, get the triplets inside the chunk
                for (const dia of Object.keys(dayCols)) {
                    const colIdx = dayCols[dia];

                    const rawVals: string[] = [];
                    for (let r = 0; r < blockRows.length; r++) {
                        const v = blockRows[r][colIdx];
                        if (v && String(v).trim() !== '') {
                            const strVal = String(v).trim();
                            if (rawVals.length === 0 || rawVals[rawVals.length - 1] !== strVal) {
                                rawVals.push(strVal);
                            }
                        }
                    }

                    if (rawVals.length > 0) {
                        let asignatura = rawVals[0];
                        let sala = rawVals.length > 2 ? rawVals[rawVals.length - 1] : (rawVals.length === 2 && (rawVals[1].toLowerCase().includes('sala') || /\d/.test(rawVals[1])) ? rawVals[1] : 'Sin Sala');
                        let profesor = 'Sin Profesor';

                        if (rawVals.length >= 3) {
                            profesor = rawVals.slice(1, rawVals.length - 1).join(" ");
                        } else if (rawVals.length === 2 && !rawVals[1].toLowerCase().includes('sala') && !/\d/.test(rawVals[1])) {
                            profesor = rawVals[1];
                            sala = 'Sin Sala';
                        } else if (rawVals.length === 1) {
                            profesor = rawVals[0]; // If there's only 1 thing, fallback
                        }

                        asignatura = String(asignatura).trim();
                        profesor = String(profesor).trim();
                        sala = String(sala).replace(/SALA/gi, '').trim() || 'Desconocida';

                        // Get or create Asignatura
                        let asignaturaId: number;
                        const [asigRows] = await connection.query<RowDataPacket[]>("SELECT id FROM asignaturas WHERE nombre = ?", [asignatura]);
                        if (asigRows.length > 0) {
                            asignaturaId = asigRows[0].id;
                        } else {
                            const [info] = await connection.query<ResultSetHeader>("INSERT INTO asignaturas (nombre) VALUES (?)", [asignatura]);
                            asignaturaId = info.insertId;
                        }

                        // Get or create Profesor
                        let profesorId: number;
                        const [profRows] = await connection.query<RowDataPacket[]>("SELECT id FROM profesores WHERE nombre = ?", [profesor]);
                        if (profRows.length > 0) {
                            profesorId = profRows[0].id;
                        } else {
                            const [info] = await connection.query<ResultSetHeader>("INSERT INTO profesores (nombre) VALUES (?)", [profesor]);
                            profesorId = info.insertId;
                        }

                        // Get or create Sala
                        let salaId: number;
                        const [salaRows] = await connection.query<RowDataPacket[]>("SELECT id FROM salas WHERE nombre = ?", [sala]);
                        if (salaRows.length > 0) {
                            salaId = salaRows[0].id;
                        } else {
                            const [info] = await connection.query<ResultSetHeader>("INSERT INTO salas (nombre) VALUES (?)", [sala]);
                            salaId = info.insertId;
                        }

                        // Update or Insert Horario (ignore if conflict exists)
                        const [conflictRows] = await connection.query<RowDataPacket[]>(`
                      SELECT id FROM horarios 
                      WHERE (profesor_id = ? OR sala_id = ? OR curso_id = ?) 
                      AND dia_semana = ? AND bloque_id = ?
                    `, [profesorId, salaId, cursoId, dia, bloqueId]);

                        if (conflictRows.length === 0) {
                            await connection.query(`
                        INSERT INTO horarios (curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                      `, [cursoId, asignaturaId, profesorId, salaId, dia, bloqueId]);
                            clasesImportadas++;
                        }
                    }
                }
            }
        }

        await connection.commit();
        console.log(`¡Archivo "${file}" importado exitosamente! Se procesaron ${clasesImportadas} clases.`);
    }

    await connection.end();
}

run().catch(console.error);
