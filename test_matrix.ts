import * as xlsx from 'xlsx';
import * as fs from 'fs';

const fileBuffer = fs.readFileSync('2026 -1 CCEE Cubierta  28.01.26.xlsx');
const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
const sheet = workbook.Sheets['Nivel 1'];

const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
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

fs.writeFileSync('matrix.json', JSON.stringify(matrix.slice(5, 25), null, 2));
