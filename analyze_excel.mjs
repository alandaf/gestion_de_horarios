import * as xlsx from 'xlsx';
import * as fs from 'fs';

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

function parseTimeBox(text) {
    if (!text) return null;
    let clean = text.replace(/a/g, '-').replace(/\s+/g, '');
    let parts = clean.split('-');
    if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 5) {
        return { start: parts[0], end: parts[1] };
    }
    return null;
}

function processWorkbook(filename) {
    console.log(`Processing ${filename}...`);
    const fileBuffer = fs.readFileSync(filename);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    let allClasses = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];

        // Resolve merged cells by filling them down and right in a custom 2D array
        const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
        const matrix = [];

        for (let R = range.s.r; R <= range.e.r; ++R) {
            matrix[R] = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
                const cell = sheet[cellRef];
                matrix[R][C] = cell ? cell.v : null;
            }
        }

        // Fill merged cells with top-left value
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

        // Now 'matrix' has no gaps where merges were.

        // 1. Find Header Row (LUNES, MARTES...)
        let headerRowIdx = -1;
        for (let r = 0; r < matrix.length; r++) {
            const rowStr = matrix[r].join("").toUpperCase();
            if (rowStr.includes('LUNES') && rowStr.includes('MARTES')) {
                headerRowIdx = r;
                break;
            }
        }

        if (headerRowIdx === -1) {
            console.log(`Skipping sheet ${sheetName} - could not find header row`);
            continue;
        }

        // 2. Identify Day columns and Time Column
        const dayCols = {};
        const headers = matrix[headerRowIdx];
        let timeColIdx = 0;

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
            }
        }

        // 3. Scan rows to build classes
        // The structure is usually 3 rows per time block: Asignatura -> Profesor -> Sala

        for (let r = headerRowIdx + 1; r < matrix.length; r += 3) {
            // Safety check
            if (r + 2 >= matrix.length) break;

            const timeStr = matrix[r][timeColIdx];
            const parsedTime = typeof timeStr === 'string' ? parseTimeBox(timeStr) : null;

            if (!parsedTime) {
                // Not a valid time block start, move ahead by 1 (maybe empty row?)
                r -= 2;
                continue;
            }

            // For each day column, get the triplets
            for (const day of Object.keys(dayCols)) {
                const colIdx = dayCols[day];

                const asignatura = matrix[r][colIdx];
                const profesor = matrix[r + 1][colIdx];
                let sala = matrix[r + 2][colIdx];

                if (asignatura && profesor && sala) {
                    // Cleanup sala
                    if (typeof sala === 'string') {
                        sala = sala.replace(/SALA/gi, '').trim();
                    }

                    allClasses.push({
                        curso: sheetName.trim(), // Assuming sheet name is the entire course/nivel
                        dia: day,
                        hora_inicio: parsedTime.start,
                        hora_fin: parsedTime.end,
                        asignatura: String(asignatura).trim(),
                        profesor: String(profesor).trim(),
                        sala: String(sala).trim()
                    });
                }
            }
        }
    }

    console.log(`Found ${allClasses.length} valid classes in ${filename}`);
    fs.writeFileSync(`parsed_${filename}.json`, JSON.stringify(allClasses, null, 2));
}

processWorkbook('2026 -1 CCEE Cubierta  28.01.26.xlsx');
processWorkbook('2026 -1 CCEE Maquinas 28.01.26.xlsx');

