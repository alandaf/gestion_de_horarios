import * as xlsx from 'xlsx';
import * as fs from 'fs';

const fileBuffer = fs.readFileSync('2026 -1 CCEE Cubierta  28.01.26.xlsx');
const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
const sheetName = 'Nivel 1';
const sheet = workbook.Sheets[sheetName];

let headerRowIdx = -1;
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for (let i = 0; i < Math.min(10, data.length); i++) {
    if (data[i] && (data[i] as any[]).includes('LUNES')) {
        headerRowIdx = i;
        break;
    }
}
console.log(`Header is at row ${headerRowIdx}`);

console.log(`Merges for ${sheetName}:`);
if (sheet['!merges']) {
    sheet['!merges'].forEach(m => {
        // only print merges that start after header
        if (m.s.r > headerRowIdx) {
            let val = sheet[xlsx.utils.encode_cell({ r: m.s.r, c: m.s.c })];
            console.log(`Merge from R${m.s.r} C${m.s.c} to R${m.e.r} C${m.e.c} Value: ${val ? val.v : null}`);
        }
    });
}
