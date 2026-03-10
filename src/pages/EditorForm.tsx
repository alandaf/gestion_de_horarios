import React, { useState } from "react";
import { X, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Curso, Profesor, Asignatura, Sala, BloqueHorario, Horario } from "../types";

interface EditorFormProps {
  cursos: Curso[];
  profesores: Profesor[];
  asignaturas: Asignatura[];
  salas: Sala[];
  bloques: BloqueHorario[];
  horarios: Horario[];
  initialData: Horario | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditorForm({ cursos, profesores, asignaturas, salas, bloques, horarios, onSuccess, initialData, onCancel }: EditorFormProps) {
  const [formData, setFormData] = useState({
    curso_id: initialData?.curso_id || "",
    asignatura_id: initialData?.asignatura_id || "",
    profesor_id: initialData?.profesor_id || "",
    sala_id: initialData?.sala_id || "",
    dia_semana: initialData?.dia_semana || "Lunes",
    bloque_id: initialData?.bloque_id || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEditing = !!initialData;
    const url = isEditing ? '/api/horarios/' + initialData.id : "/api/horarios";
    const method = isEditing ? "PUT" : "POST";

    const promise = window.fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar la clase");
      return data;
    });

    toast.promise(promise, {
      loading: isEditing ? 'Actualizando clase...' : 'Programando clase...',
      success: () => {
        onSuccess();
        return isEditing ? 'Clase actualizada exitosamente' : 'Clase programada exitosamente';
      },
      error: (err) => err.message,
      finally: () => setLoading(false)
    });
  };

  // Real-time conflict logic
  const checkConflicts = () => {
    const { profesor_id, sala_id, curso_id, dia_semana, bloque_id, asignatura_id } = formData;
    const newConflicts: string[] = [];
    
    if (!dia_semana || !bloque_id) return [];

    horarios.forEach(h => {
      // Skip current being edited
      if (initialData && h.id === initialData.id) return;

      const sameTime = h.dia_semana === dia_semana && h.bloque_id === Number(bloque_id);
      if (!sameTime) return;

      // Shared class: Same Professor + Same Subject + Same Room + Same Time = ALLOWED
      const isSharedClass = 
        h.profesor_id === Number(profesor_id) && 
        h.asignatura_id === Number(asignatura_id) && 
        h.sala_id === Number(sala_id);

      if (isSharedClass) return;

      if (h.profesor_id === Number(profesor_id) && h.asignatura_id !== Number(asignatura_id)) {
        newConflicts.push(`Profesor ${h.profesor_nombre} ya tiene clase distinta en este horario.`);
      }
      if (h.sala_id === Number(sala_id) && (h.asignatura_id !== Number(asignatura_id) || h.profesor_id !== Number(profesor_id))) {
        newConflicts.push(`Sala ${h.sala_nombre} ya está ocupada por otra clase.`);
      }
      if (h.curso_id === Number(curso_id)) {
        newConflicts.push(`Este curso ya tiene otra clase programada en este bloque.`);
      }
    });

    return [...new Set(newConflicts)];
  };

  const availableRooms = salas.filter(sala => {
    if (!formData.dia_semana || !formData.bloque_id) return true;
    return !horarios.some(h => 
      h.dia_semana === formData.dia_semana && 
      h.bloque_id === Number(formData.bloque_id) && 
      h.sala_id === sala.id &&
      (initialData ? h.id !== initialData.id : true) &&
      // Shared class exception
      !(h.profesor_id === Number(formData.profesor_id) && h.asignatura_id === Number(formData.asignatura_id))
    );
  });

  const conflicts = checkConflicts();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-2xl mx-auto anime-in slide-in-from-bottom-8 duration-500">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar Clase' : 'Programar Nueva Clase'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Curso</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.curso_id} onChange={e => setFormData({ ...formData, curso_id: e.target.value })}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Asignatura</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.asignatura_id} onChange={e => setFormData({ ...formData, asignatura_id: e.target.value })}>
                <option value="">Selecciona asignatura</option>
                {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Profesor</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.profesor_id} onChange={e => setFormData({ ...formData, profesor_id: e.target.value })}>
                <option value="">Selecciona profesor</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Día</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.dia_semana} onChange={e => setFormData({ ...formData, dia_semana: e.target.value })}>
                <option value="">Selecciona día</option>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bloque Horario</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.bloque_id} onChange={e => setFormData({ ...formData, bloque_id: e.target.value })}>
                <option value="">Selecciona horario</option>
                {bloques.map(b => <option key={b.id} value={b.id}>{b.hora_inicio} - {b.hora_fin}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sala</label>
              <select required className="w-full border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-gray-50/50"
                value={formData.sala_id} onChange={e => setFormData({ ...formData, sala_id: e.target.value })}>
                <option value="">Selecciona sala</option>
                {salas.map(s => {
                  const available = availableRooms.some(ar => ar.id === s.id);
                  return (
                    <option key={s.id} value={s.id} className={available ? "text-emerald-600 font-bold" : "text-gray-400"}>
                      {s.nombre} {available ? " (Disponible ✨)" : " (Ocupada)"}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="md:col-span-2 p-4 bg-rose-50 border border-rose-100 rounded-xl animate-in shake duration-300">
              <div className="flex items-start space-x-3 text-rose-700">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <p className="font-bold mb-1">¡Conflicto Detectado!</p>
                  <ul className="list-disc list-inside space-y-1">
                    {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {formData.bloque_id && formData.profesor_id && formData.sala_id && conflicts.length === 0 && (
            <div className="md:col-span-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center text-emerald-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="mr-3" size={20} />
              <p className="text-sm font-semibold">Horario disponible y sin conflictos detectados.</p>
            </div>
          )}

          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all font-semibold">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold disabled:opacity-50">
              {initialData ? "Guardar Cambios" : "Crear Clase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
