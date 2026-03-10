import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, Database, Upload as UploadIcon, Menu, X, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { Curso, Profesor, Asignatura, Sala, BloqueHorario, Horario } from './types';

// Importing new modular pages
import { Dashboard } from './pages/Dashboard';
import { CalendarView } from './pages/CalendarView';
import { ImporterView } from './pages/ImporterView';
import { ManageData } from './pages/ManageData';
import { EditorForm } from './pages/EditorForm';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  // Filtering states
  const [filterCurso, setFilterCurso] = useState('');
  const [filterProfesor, setFilterProfesor] = useState('');
  const [filterSala, setFilterSala] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Horario | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ title: string, message: string, onConfirm: () => void }>({
    title: "", message: "", onConfirm: () => { }
  });

  const fetchData = async () => {
    try {
      const [curRes, profRes, asigRes, salasRes, bloqRes, horRes] = await Promise.all([
        window.fetch('/api/cursos').then(res => res.json()),
        window.fetch('/api/profesores').then(res => res.json()),
        window.fetch('/api/asignaturas').then(res => res.json()),
        window.fetch('/api/salas').then(res => res.json()),
        window.fetch('/api/bloques').then(res => res.json()),
        window.fetch('/api/horarios').then(res => res.json())
      ]);

      setCursos(curRes || []);
      setProfesores(profRes || []);
      setAsignaturas(asigRes || []);
      setSalas(salasRes || []);
      setBloques(bloqRes || []);
      setHorarios(horRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error de conexión. Revisa que el servidor este encendido.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDeleteDialog = (type: string, id: number | string, name: string) => {
    setDialogConfig({
      title: 'Eliminar ' + type.slice(0, -1),
      message: '¿Estás seguro de que deseas eliminar "' + name + '"? Esta acción no se puede deshacer y podría eliminar clases asociadas en el calendario.',
      onConfirm: async () => {
        try {
          const res = await window.fetch('/api/' + type + '/' + id, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Error al eliminar');
          }
          toast.success('El elemento "' + name + '" ha sido eliminado.');
          fetchData();
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setDialogOpen(false);
        }
      }
    });
    setDialogOpen(true);
  };

  const openDeleteHorarioDialog = (id: number) => {
    setDialogConfig({
      title: "Eliminar Clase del Calendario",
      message: "¿Deseas remover este bloque del calendario permanentemente?",
      onConfirm: async () => {
        try {
          const res = await window.fetch('/api/horarios/' + id, { method: 'DELETE' });
          if (!res.ok) throw new Error('Error al eliminar el bloque programado');
          toast.success("Clase eliminada del horario.");
          fetchData();
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setDialogOpen(false);
        }
      }
    });
    setDialogOpen(true);
  };

  const filteredHorarios = horarios.filter(h => {
    if (filterCurso && h.curso_id.toString() !== filterCurso) return false;
    if (filterProfesor && h.profesor_id.toString() !== filterProfesor) return false;
    if (filterSala && h.sala_id.toString() !== filterSala) return false;
    return true;
  });

  const getStats = () => ({
    totalCursos: cursos.length,
    totalProfesores: profesores.length,
    totalAsignaturas: asignaturas.length,
    totalClases: horarios.length
  });

  const handleDashboardAction = (id: string) => {
    if (id === 'new') {
      fetchData();
      setIsEditing(true);
      setEditingData(null);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900">
      <Toaster position="top-right" richColors />
      <ConfirmDialog
        isOpen={dialogOpen}
        {...dialogConfig}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Sidebar Overlay on Mobile */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed z-40 top-4 left-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={(isSidebarOpen ? 'translate-x-0' : '-translate-x-full') + ' md:translate-x-0 fixed md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none'}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Calendar className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Academia<span className="text-indigo-600">Sync</span>
            </span>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto w-full">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'calendar', label: 'Horarios', icon: Calendar },
            { id: 'importer', label: 'Importador (Excel)', icon: UploadIcon },
            { id: 'data', label: 'Base de Datos', icon: Database },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsEditing(false); }}
              className={'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ' + (
                activeTab === item.id && !isEditing
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={20} className={activeTab === item.id && !isEditing ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className="font-semibold">{item.label}</span>
              </div>
              {activeTab === item.id && !isEditing && (
                <motion.div layoutId="activeTab" className="w-1 h-5 bg-white/40 rounded-full" />
              )}
            </button>
          ))}

          <div className="pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => { fetchData(); setIsEditing(true); setEditingData(null); }}
              className={'w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 font-semibold ' +
                (isEditing && !editingData ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md')}
            >
              <Plus size={20} />
              <span>Programar Clase</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col w-full">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-indigo-700 font-bold text-sm">AD</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={isEditing ? 'editor' : activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isEditing ? (
                <EditorForm
                  cursos={cursos} profesores={profesores} asignaturas={asignaturas}
                  salas={salas} bloques={bloques} horarios={horarios}
                  initialData={editingData}
                  onSuccess={() => { fetchData(); setIsEditing(false); }}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard stats={getStats()} onAction={handleDashboardAction} />}
                  {activeTab === 'calendar' && (
                    <CalendarView
                      cursos={cursos} profesores={profesores} salas={salas}
                      bloques={bloques} horarios={filteredHorarios}
                      filterCurso={filterCurso} setFilterCurso={setFilterCurso}
                      filterProfesor={filterProfesor} setFilterProfesor={setFilterProfesor}
                      filterSala={filterSala} setFilterSala={setFilterSala}
                      onEdit={(clase) => { setEditingData(clase); setIsEditing(true); }}
                      onDelete={(id) => openDeleteHorarioDialog(id)}
                    />
                  )}
                  {activeTab === 'importer' && <ImporterView onSuccess={fetchData} />}
                  {activeTab === 'data' && (
                    <ManageData
                      cursos={cursos} profesores={profesores} asignaturas={asignaturas}
                      salas={salas} bloques={bloques}
                      onDataChange={fetchData}
                      onDeleteRequest={openDeleteDialog}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="p-6 text-center text-sm text-gray-400 border-t border-gray-100 bg-white">
          <p>© 2026 Andrés Landa Figueroa - AcademiaSync | Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
