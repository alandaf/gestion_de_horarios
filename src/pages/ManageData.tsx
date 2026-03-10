import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Curso, Profesor, Asignatura, Sala, BloqueHorario } from "../types";
import { toast } from "sonner";

interface ManageDataProps {
  cursos: Curso[];
  profesores: Profesor[];
  asignaturas: Asignatura[];
  salas: Sala[];
  bloques: BloqueHorario[];
  onDataChange: () => void;
  onDeleteRequest: (type: 'cursos' | 'profesores' | 'asignaturas' | 'salas' | 'bloques', id: number | string, name: string) => void;
}

export function ManageData({ cursos, profesores, asignaturas, salas, bloques, onDataChange, onDeleteRequest }: ManageDataProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newBloqueInicio, setNewBloqueInicio] = useState("");
  const [newBloqueFin, setNewBloqueFin] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingValue2, setEditingValue2] = useState(""); // For blocks (end time)

  const handleAddItem = async (endpoint: string, data: any, typeName: string) => {
    if (!newItemName && endpoint !== 'bloques') return;
    if (endpoint === 'bloques' && (!newBloqueInicio || !newBloqueFin)) return;

    const promise = window.fetch('/api/' + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(endpoint === 'bloques' ? { hora_inicio: newBloqueInicio, hora_fin: newBloqueFin } : data)
    }).then(async (res) => {
      const respData = await res.json();
      if (!res.ok) throw new Error(respData.error || 'Error al añadir ' + typeName);
      return respData;
    });

    toast.promise(promise, {
      loading: 'Añadiendo ' + typeName + '...',
      success: () => {
        setNewItemName("");
        setNewBloqueInicio("");
        setNewBloqueFin("");
        onDataChange();
        return typeName + ' añadido exitosamente';
      },
      error: (err) => err.message
    });
  };

  const handleEditSave = async (type: string, id: number) => {
    const payload = type === 'bloques'
      ? { hora_inicio: editingValue, hora_fin: editingValue2 }
      : { nombre: editingValue };

    try {
      const res = await window.fetch(`/api/${type}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success("Actualizado correctamente");
      setEditingId(null);
      setEditingType(null);
      onDataChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const startEditing = (item: any, type: string) => {
    setEditingId(item.id);
    setEditingType(type);
    if (type === 'bloques') {
      setEditingValue(item.hora_inicio);
      setEditingValue2(item.hora_fin);
    } else {
      setEditingValue(item.nombre);
    }
  };

  const renderList = (items: any[], type: 'cursos' | 'profesores' | 'asignaturas' | 'salas' | 'bloques', title: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[400px]">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>

      <div className="flex space-x-2 mb-4">
        {type === 'bloques' ? (
          <>
            <input type="time" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newBloqueInicio} onChange={e => setNewBloqueInicio(e.target.value)} />
            <span className="text-gray-500 self-center">-</span>
            <input type="time" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newBloqueFin} onChange={e => setNewBloqueFin(e.target.value)} />
          </>
        ) : (
          <input type="text" placeholder={'Nuevo ' + title.toLowerCase() + '...'} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newItemName} onChange={e => setNewItemName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAddItem(type, { nombre: newItemName, capacidad: 30, departamento: "General" }, title)}
          />
        )}
        <button onClick={() => handleAddItem(type, { nombre: newItemName, capacidad: 30, departamento: "General" }, title)}
          className="bg-indigo-100 text-indigo-600 p-2 rounded-lg hover:bg-indigo-200 transition-colors shrink-0">
          <Plus size={20} />
        </button>
      </div>

      <div className="overflow-y-auto pr-2 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
        {items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-indigo-100 transition-colors">
            {editingId === item.id && editingType === type ? (
              <div className="flex-1 flex items-center space-x-2">
                {type === 'bloques' ? (
                  <>
                    <input type="time" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                      value={editingValue} onChange={e => setEditingValue(e.target.value)} />
                    <input type="time" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                      value={editingValue2} onChange={e => setEditingValue2(e.target.value)} />
                  </>
                ) : (
                  <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                    value={editingValue} onChange={e => setEditingValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleEditSave(type, item.id)} />
                )}
                <button onClick={() => handleEditSave(type, item.id)} className="text-green-600 hover:text-green-700 p-1">
                  <Check size={16} />
                </button>
                <button onClick={() => { setEditingId(null); setEditingType(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {type === 'bloques' ? item.hora_inicio + ' - ' + item.hora_fin : item.nombre}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => startEditing(item, type)}
                    className="text-gray-400 hover:text-indigo-500 p-1 hover:bg-indigo-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDeleteRequest(type, item.id, type === 'bloques' ? item.hora_inicio + ' - ' + item.hora_fin : item.nombre)}
                    className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No hay {title.toLowerCase()} registrados</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Administrar Datos Base</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderList(cursos, 'cursos', 'Cursos')}
        {renderList(profesores, 'profesores', 'Profesores')}
        {renderList(asignaturas, 'asignaturas', 'Asignaturas')}
        {renderList(salas, 'salas', 'Salas')}
        {renderList(bloques, 'bloques', 'Bloques Horarios')}
      </div>
    </div>
  );
}
