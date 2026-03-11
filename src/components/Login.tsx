import React, { useState } from 'react';
import { Lock, User, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (user: any) => void;
  onCancel: () => void;
}

export function Login({ onLogin, onCancel }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Bienvenido, ${data.user.usuario}`);
        onLogin(data.user);
      } else {
        toast.error(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full border border-slate-100"
      >
        <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="currentColor" />
            </svg>
          </div>
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <ShieldCheck size={40} />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Acceso Institucional</h2>
          <p className="text-indigo-100 text-sm">Ingresa tus credenciales para administrar los horarios</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Usuario</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="nombre_usuario"
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Volver al Calendario
            </button>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <GraduationCap size={14} />
                <span>AcademiaSync Institutional Portal</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
