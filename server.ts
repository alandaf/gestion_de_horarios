import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import * as xlsx from "xlsx";
import { db } from "./src/db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.get("/api/dashboard", async (req: Request, res: Response) => {
    try {
      const [[totalCursos]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM cursos");
      const [[totalProfesores]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM profesores");
      const [[totalAsignaturas]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM asignaturas");
      const [[totalClases]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM horarios");

      res.json({
        totalCursos: totalCursos.count,
        totalProfesores: totalProfesores.count,
        totalAsignaturas: totalAsignaturas.count,
        totalClases: totalClases.count,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/horarios", async (req: Request, res: Response) => {
    const { curso_id, profesor_id, sala_id } = req.query;
    let query = `
      SELECT h.*, 
             c.nombre as curso_nombre, 
             a.nombre as asignatura_nombre, 
             p.nombre as profesor_nombre, 
             s.nombre as sala_nombre,
             b.hora_inicio, b.hora_fin
      FROM horarios h
      JOIN cursos c ON h.curso_id = c.id
      JOIN asignaturas a ON h.asignatura_id = a.id
      JOIN profesores p ON h.profesor_id = p.id
      JOIN salas s ON h.sala_id = s.id
      JOIN bloques_horarios b ON h.bloque_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (curso_id) {
      query += " AND h.curso_id = ?";
      params.push(curso_id);
    }
    if (profesor_id) {
      query += " AND h.profesor_id = ?";
      params.push(profesor_id);
    }
    if (sala_id) {
      query += " AND h.sala_id = ?";
      params.push(sala_id);
    }

    try {
      const [horarios] = await db.query(query, params);
      res.json(horarios);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/horarios", async (req: Request, res: Response): Promise<any> => {
    const { curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id } = req.body;

    // Validations
    try {
      // Conflicto de profesor (excluyendo clases compartidas en cursos DISTINTOS)
      const [profesorConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE profesor_id = ? AND dia_semana = ? AND bloque_id = ? AND (asignatura_id != ? OR curso_id = ?)",
        [profesor_id, dia_semana, bloque_id, asignatura_id, curso_id]
      );
      if (profesorConflict.length > 0) return res.status(400).json({ error: "Conflicto de profesor: El profesor ya tiene una clase en este horario." });

      // Conflicto de sala (excluyendo clases compartidas en cursos DISTINTOS)
      const [salaConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE sala_id = ? AND dia_semana = ? AND bloque_id = ? AND ((asignatura_id != ? OR profesor_id != ?) OR curso_id = ?)",
        [sala_id, dia_semana, bloque_id, asignatura_id, profesor_id, curso_id]
      );
      if (salaConflict.length > 0) return res.status(400).json({ error: "Conflicto de sala: La sala ya está ocupada por otra clase en este horario." });

      // Conflicto de curso
      const [cursoConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE curso_id = ? AND dia_semana = ? AND bloque_id = ?",
        [curso_id, dia_semana, bloque_id]
      );
      if (cursoConflict.length > 0) return res.status(400).json({ error: "Conflicto de curso: El curso ya tiene una clase en este horario." });

      const [info] = await db.query<ResultSetHeader>(`
        INSERT INTO horarios (curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id]);

      res.json({ id: info.insertId, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/horarios/:id", async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id } = req.body;

    try {
      // Conflicto de profesor (excluyendo el actual y clases compartidas en otros cursos)
      const [profesorConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE profesor_id = ? AND dia_semana = ? AND bloque_id = ? AND id != ? AND (asignatura_id != ? OR curso_id = ?)",
        [profesor_id, dia_semana, bloque_id, id, asignatura_id, curso_id]
      );
      if (profesorConflict.length > 0) return res.status(400).json({ error: "Conflicto de profesor: El profesor ya tiene una clase en este horario." });

      // Conflicto de sala (excluyendo el actual y clases compartidas en otros cursos)
      const [salaConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE sala_id = ? AND dia_semana = ? AND bloque_id = ? AND id != ? AND ((asignatura_id != ? OR profesor_id != ?) OR curso_id = ?)",
        [sala_id, dia_semana, bloque_id, id, asignatura_id, profesor_id, curso_id]
      );
      if (salaConflict.length > 0) return res.status(400).json({ error: "Conflicto de sala: La sala ya está ocupada por otra clase en este horario." });

      // Conflicto de curso (excluyendo el actual)
      const [cursoConflict] = await db.query<RowDataPacket[]>(
        "SELECT id FROM horarios WHERE curso_id = ? AND dia_semana = ? AND bloque_id = ? AND id != ?",
        [curso_id, dia_semana, bloque_id, id]
      );
      if (cursoConflict.length > 0) return res.status(400).json({ error: "Conflicto de curso: El curso ya tiene una clase en este horario." });

      await db.query(`
        UPDATE horarios 
        SET curso_id = ?, asignatura_id = ?, profesor_id = ?, sala_id = ?, dia_semana = ?, bloque_id = ?
        WHERE id = ?
      `, [curso_id, asignatura_id, profesor_id, sala_id, dia_semana, bloque_id, id]);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/horarios/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM horarios WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Endpoints for dropdowns
  app.get("/api/cursos", async (req: Request, res: Response) => {
    const [rows] = await db.query("SELECT * FROM cursos ORDER BY nombre ASC");
    res.json(rows);
  });

  app.post("/api/cursos", async (req: Request, res: Response) => {
    try {
      const { nombre, carrera_id } = req.body;
      const [info] = await db.query<ResultSetHeader>("INSERT INTO cursos (nombre, carrera_id) VALUES (?, ?)", [nombre, carrera_id || 1]);
      res.json({ id: info.insertId, success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al crear curso" });
    }
  });

  app.put("/api/cursos/:id", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      await db.query("UPDATE cursos SET nombre = ? WHERE id = ?", [nombre, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar curso" });
    }
  });

  app.delete("/api/cursos/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM cursos WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar curso. Asegúrese de que no tenga clases asociadas." });
    }
  });

  app.get("/api/profesores", async (req: Request, res: Response) => {
    const [rows] = await db.query("SELECT * FROM profesores ORDER BY nombre ASC");
    res.json(rows);
  });

  app.post("/api/profesores", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      const [info] = await db.query<ResultSetHeader>("INSERT INTO profesores (nombre) VALUES (?)", [nombre]);
      res.json({ id: info.insertId, success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al crear profesor" });
    }
  });
  app.put("/api/profesores/:id", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      await db.query("UPDATE profesores SET nombre = ? WHERE id = ?", [nombre, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar profesor" });
    }
  });
  app.delete("/api/profesores/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM profesores WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar profesor. Asegúrese de que no tenga clases asociadas." });
    }
  });

  app.get("/api/asignaturas", async (req: Request, res: Response) => {
    const [rows] = await db.query("SELECT * FROM asignaturas ORDER BY nombre ASC");
    res.json(rows);
  });
  app.post("/api/asignaturas", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      const [info] = await db.query<ResultSetHeader>("INSERT INTO asignaturas (nombre) VALUES (?)", [nombre]);
      res.json({ id: info.insertId, success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al crear asignatura" });
    }
  });
  app.put("/api/asignaturas/:id", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      await db.query("UPDATE asignaturas SET nombre = ? WHERE id = ?", [nombre, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar asignatura" });
    }
  });
  app.delete("/api/asignaturas/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM asignaturas WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar asignatura. Asegúrese de que no tenga clases asociadas." });
    }
  });

  app.get("/api/salas", async (req: Request, res: Response) => {
    const [rows] = await db.query("SELECT * FROM salas ORDER BY nombre ASC");
    res.json(rows);
  });
  app.post("/api/salas", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      const [info] = await db.query<ResultSetHeader>("INSERT INTO salas (nombre) VALUES (?)", [nombre]);
      res.json({ id: info.insertId, success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al crear sala" });
    }
  });
  app.put("/api/salas/:id", async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;
      await db.query("UPDATE salas SET nombre = ? WHERE id = ?", [nombre, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar sala" });
    }
  });
  app.delete("/api/salas/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM salas WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar sala. Asegúrese de que no tenga clases asociadas." });
    }
  });

  app.get("/api/bloques", async (req: Request, res: Response) => {
    const [rows] = await db.query("SELECT * FROM bloques_horarios ORDER BY hora_inicio ASC");
    res.json(rows);
  });
  app.post("/api/bloques", async (req: Request, res: Response) => {
    try {
      const { hora_inicio, hora_fin } = req.body;
      const [info] = await db.query<ResultSetHeader>("INSERT INTO bloques_horarios (hora_inicio, hora_fin) VALUES (?, ?)", [hora_inicio, hora_fin]);
      res.json({ id: info.insertId, success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al crear bloque" });
    }
  });
  app.put("/api/bloques/:id", async (req: Request, res: Response) => {
    try {
      const { hora_inicio, hora_fin } = req.body;
      await db.query("UPDATE bloques_horarios SET hora_inicio = ?, hora_fin = ? WHERE id = ?", [hora_inicio, hora_fin, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar bloque" });
    }
  });
  app.delete("/api/bloques/:id", async (req: Request, res: Response) => {
    try {
      await db.query("DELETE FROM bloques_horarios WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar bloque. Asegúrese de que no tenga clases asociadas." });
    }
  });

  // Import Excel
  app.post("/api/import", upload.single("file"), async (req: Request, res: Response): Promise<any> => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const connection = await db.getConnection();
    try {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

      await connection.beginTransaction();
      let clasesImportadas = 0;

      // Replace naive parsing with the robust matrix parser for merged cells
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
      res.json({ success: true, message: `Archivo importado correctamente. Se crearon ${clasesImportadas} clases nuevas.` });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ error: "Error al procesar el archivo Excel" });
    } finally {
      connection.release();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
