import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Users, BookMarked, CalendarDays, TrendingUp, Clock, MapPin } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color: string;
  delay: number;
}

function StatCard({ title, value, icon: Icon, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group hover:shadow-lg transition-all"
    >
      <div className="z-10">
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} text-white z-10 shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>

      {/* Background decoration */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
    </motion.div>
  );
}

export function Dashboard({
  stats,
  onAction
}: {
  stats: { totalCursos: number, totalProfesores: number, totalAsignaturas: number, totalClases: number },
  onAction: (action: string) => void
}) {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control</h2>
          <p className="text-gray-500 mt-1">Resumen general de tu institución y horarios.</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100/50">
          <Clock size={18} className="text-indigo-600" />
          <span className="text-indigo-700 font-medium text-sm">
            Actualizado hoy: {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cursos Activos" value={stats.totalCursos} icon={GraduationCap} color="bg-indigo-600" delay={0.1} />
        <StatCard title="Docentes" value={stats.totalProfesores} icon={Users} color="bg-emerald-500" delay={0.2} />
        <StatCard title="Asignaturas" value={stats.totalAsignaturas} icon={BookMarked} color="bg-amber-500" delay={0.3} />
        <StatCard title="Clases Programadas" value={stats.totalClases} icon={CalendarDays} color="bg-rose-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
            <div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 inline-block">
                Estado del Sistema
              </span>
              <h3 className="text-2xl font-bold mb-2">Sistema AcademiaSync</h3>
              <p className="text-indigo-100 max-w-md">
                Has importado correctamente todos los horarios del semestre 2026-1. El sistema está sincronizado con la base de datos MySQL local.
              </p>
            </div>
            <div className="flex space-x-4 mt-6">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default">
                <TrendingUp size={18} />
                <span className="text-sm">7 Cursos Totales</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default">
                <MapPin size={18} />
                <span className="text-sm">5 Salas en Uso</span>
              </div>
            </div>
          </div>

          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
        >
          <h4 className="text-lg font-bold text-gray-800 mb-4 px-2">Acciones Rápidas</h4>
          <div className="space-y-2">
            {[
              { id: 'new', label: 'Nueva Programación', desc: 'Añadir clase individual', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { id: 'calendar', label: 'Consultar Horarios', desc: 'Ver y descargar PDF', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { id: 'data', label: 'Administrar Datos', desc: 'Editar profesores, salas, etc.', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => onAction(action.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group ${action.color}`}
              >
                <p className="font-bold text-sm">{action.label}</p>
                <p className="text-xs opacity-70">{action.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
