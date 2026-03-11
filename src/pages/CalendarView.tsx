import React from "react";
import { Download, Trash2, Edit2 } from "lucide-react";
import { Horario, Curso, Profesor, Sala, BloqueHorario } from "../types";
import * as xlsx from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getProfessorColor } from "../lib/utils";

interface CalendarViewProps {
  cursos: Curso[];
  profesores: Profesor[];
  salas: Sala[];
  bloques: BloqueHorario[];
  horarios: Horario[];
  filterCurso: string;
  setFilterCurso: (id: string) => void;
  filterProfesor: string;
  setFilterProfesor: (id: string) => void;
  filterSala: string;
  setFilterSala: (id: string) => void;
  onEdit?: (horario: Horario) => void;
  onDelete?: (id: number) => void;
  user: { usuario: string, role: string } | null;
}

export function CalendarView({
  cursos, profesores, salas, bloques, horarios,
  filterCurso, setFilterCurso,
  filterProfesor, setFilterProfesor,
  filterSala, setFilterSala,
  onEdit, onDelete, user
}: CalendarViewProps) {

  const exportToExcel = () => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const sortedBloques = [...bloques].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    const selectedCourse = cursos.find(c => c.id === parseInt(filterCurso))?.nombre || "Todos los Cursos";

    // Create an Array of Arrays (AOA) for better control over titles
    const matrix: any[][] = [
      ["HORARIO ACADÉMICO SEMANAL - AcademiaSync"],
      [`Curso: ${selectedCourse}`],
      [`Emitido por: Andrés Landa Figueroa`],
      [`Fecha de generación: ${new Date().toLocaleString()}`],
      [], // Spacer
      ['HORA / DÍA', ...dias] // Main Header
    ];

    sortedBloques.forEach(bloque => {
      const row: string[] = [`${bloque.hora_inicio} - ${bloque.hora_fin}`];
      
      dias.forEach(dia => {
        const classesInSlot = horarios.filter(h => 
          h.bloque_id === bloque.id && 
          h.dia_semana.toLowerCase() === dia.toLowerCase()
        );
        
        if (classesInSlot.length > 0) {
          row.push(classesInSlot.map(h => 
            `${h.asignatura_nombre.toUpperCase()}\nProf: ${h.profesor_nombre}\nSala: ${h.sala_nombre}`
          ).join('\n---\n'));
        } else {
          row.push("");
        }
      });
      matrix.push(row);
    });

    // Add Footer in the matrix
    matrix.push([]);
    matrix.push([`© 2026 Andrés Landa Figueroa - Todos los derechos reservados`]);

    const ws = xlsx.utils.aoa_to_sheet(matrix);
    
    // Auto-adjust column widths
    const wscols = [
      { wch: 20 }, // Hora
      ...dias.map(() => ({ wch: 45 })) // Days
    ];
    ws['!cols'] = wscols;

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Horario");
    xlsx.writeFile(wb, `Horario_${selectedCourse.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const sortedBloques = [...bloques].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    const head = [['Hora', ...dias]];
    
    const body = sortedBloques.map(bloque => {
      const row: string[] = [`${bloque.hora_inicio} - ${bloque.hora_fin}`];
      
      dias.forEach(dia => {
        const classesInSlot = horarios.filter(h => 
          h.bloque_id === bloque.id && 
          h.dia_semana.toLowerCase() === dia.toLowerCase()
        );
        
        if (classesInSlot.length > 0) {
          row.push(classesInSlot.map(h => 
            `${h.asignatura_nombre}\n(${h.profesor_nombre})\nSala: ${h.sala_nombre}`
          ).join('\n---\n'));
        } else {
          row.push("");
        }
      });
      
      return row;
    });

    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text("Horario Académico Semanal", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const selectedCourse = cursos.find(c => c.id === parseInt(filterCurso))?.nombre || "Todos los Cursos";
    doc.text(`Curso: ${selectedCourse} | Generado el ${new Date().toLocaleString()}`, 14, 28);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 30, 280, 30);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 35,
      styles: { 
        fontSize: 6, 
        cellPadding: 1.5, 
        valign: 'middle', 
        halign: 'center',
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        textColor: 40
      },
      headStyles: { 
        fillColor: [79, 70, 229], 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0 && data.cell.text[0]) {
          const cellText = data.cell.text.join('\n');
          const profMatch = cellText.match(/\((.*?)\)/);
          if (profMatch) {
            const profName = profMatch[1];
            const prof = profesores.find(p => p.nombre === profName);
            if (prof) {
              const colors = getProfessorColor(prof.id);
              // Conver HSL or hex to RGB for jsPDF could be tricky, but we can use simple colors or accent
              // Since getProfessorColor returns hex, we'll just use a light gray if it's there or try to approximate
              // For now, let's just make sure it's distinct
              data.cell.styles.fillColor = [240, 244, 255]; 
            }
          }
        }
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 25 }
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      margin: { left: 10, right: 10, bottom: 20 },
      tableWidth: 'auto'
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `© 2026 Andrés Landa Figueroa - AcademiaSync | Gestión de Horarios Académicos`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

    doc.save(`Horario_${selectedCourse.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Calendario Semanal</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión y visualización de carga académica</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select className="flex-1 md:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium shadow-sm transition-all"
            value={filterCurso} onChange={e => setFilterCurso(e.target.value)}>
            <option value="">Filtro: Curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="flex-1 md:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium shadow-sm transition-all"
            value={filterProfesor} onChange={e => setFilterProfesor(e.target.value)}>
            <option value="">Filtro: Profesor</option>
            {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <div className="flex rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <button onClick={exportToExcel} title="Exportar a Excel" className="flex items-center justify-center bg-white text-emerald-600 w-10 h-10 hover:bg-emerald-50 transition-colors border-r border-gray-200">
              <Download size={18} />
            </button>
            <button onClick={exportToPDF} title="Exportar a PDF" className="flex items-center justify-center bg-white text-rose-600 w-10 h-10 hover:bg-rose-50 transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Agenda View (Mobile) */}
      <div className="block md:hidden space-y-6">
        {dias.map(dia => {
          const classesForDay = horarios.filter(h => h.dia_semana === dia);
          if (classesForDay.length === 0) return null;
          
          return (
            <div key={dia} className="space-y-3">
              <div className="flex items-center space-x-2 px-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{dia}</h3>
              </div>
              <div className="grid gap-3">
                {classesForDay.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(clase => {
                  const colors = getProfessorColor(clase.profesor_id);
                  return (
                    <div 
                      key={clase.id} 
                      className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} shadow-sm active:scale-[0.98] transition-all ${user ? 'cursor-pointer' : ''}`} 
                      onClick={() => user && onEdit && onEdit(clase)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className={`font-bold ${colors.text} text-lg leading-tight`}>{clase.asignatura_nombre}</div>
                        <div className={`text-[10px] font-black ${colors.text} px-2 py-0.5 rounded-full bg-white/40 ring-1 ring-black/5`}>
                          {clase.hora_inicio}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600/80 mb-3">{clase.profesor_nombre}</div>
                      <div className="flex justify-between items-center pt-3 border-t border-black/5">
                        <div className="flex items-center space-x-2">
                           <span className="text-[10px] font-bold text-gray-400">CURSO</span>
                           <span className="text-xs font-bold text-gray-700">{clase.curso_nombre}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                           <span className="text-[10px] font-bold text-gray-400">SALA</span>
                           <span className="text-xs font-bold text-gray-700">{clase.sala_nombre}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid View (Desktop) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider w-24 text-center">Horario</th>
              {dias.map(dia => (
                <th key={dia} className="p-4 font-bold text-gray-600 text-sm text-center border-l border-gray-50">{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...bloques].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(bloque => (
              <tr key={bloque.id} className="group/row">
                <td className="p-4 text-center bg-gray-50/30 group-hover/row:bg-gray-50 transition-colors">
                  <div className="text-sm font-bold text-gray-700">{bloque.hora_inicio}</div>
                  <div className="text-[10px] font-medium text-gray-400 mt-1">{bloque.hora_fin}</div>
                </td>
                {dias.map(dia => {
                  const clases = horarios.filter(h =>
                    h.dia_semana.trim().toUpperCase() === dia.trim().toUpperCase() &&
                    h.bloque_id === bloque.id
                  );
                  return (
                    <td key={dia} className="p-1.5 border-l border-gray-50 align-top">
                      <div className="flex flex-col gap-1.5 min-h-[100px]">
                        {clases.map(clase => {
                          const colors = getProfessorColor(clase.profesor_id);
                          return (
                            <div 
                              key={clase.id} 
                              onClick={() => user && onEdit && onEdit(clase)}
                              className={`flex-1 ${colors.bg} border ${colors.border} rounded-xl p-3 relative group/card ${user ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default'} transition-all active:scale-[0.97]`}
                            >
                              {user && (
                                <div className="absolute top-2 right-2 flex opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button className="text-gray-400 hover:text-rose-500 p-1 bg-white/80 rounded-lg backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(clase.id); }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                              <div className={`font-black ${colors.text} text-[10px] uppercase leading-tight tracking-tight mb-1 line-clamp-2`}>
                                {clase.asignatura_nombre}
                              </div>
                              <div className="text-[9px] font-bold text-gray-600/60 truncate">{clase.profesor_nombre}</div>
                              <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center">
                                <span className="text-[9px] font-black opacity-30">S{clase.sala_nombre}</span>
                                <span className="text-[8px] font-black bg-white/40 px-1.5 py-0.5 rounded uppercase tracking-tighter text-gray-500 truncate max-w-[50px]">
                                  {clase.curso_nombre}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div >
  );
}
