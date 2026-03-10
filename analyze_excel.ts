import * as xlsx from 'xlsx';

try {
    const workbook = xlsx.readFile('2026 -1 CCEE Cubierta  28.01.26.xlsx');
    console.log("Sheet names:", workbook.SheetNames);

    for (const sheetName of workbook.SheetNames) {
        console.log(`\n\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        // Read as an array of arrays so we can inspect the raw grid
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Let's print the first 20 rows to understand the layout
        for (let i = 0; i < Math.min(20, data.length); i++) {
            console.log(`Row ${i}:`, JSON.stringify(data[i]));
        }
    }
} catch (err) {
    console.error("Error reading file:", err);
}
