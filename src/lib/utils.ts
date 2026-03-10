import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getProfessorColor(id: number | string) {
  const colors = [
    { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', accent: '#3b82f6' },
    { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', accent: '#10b981' },
    { bg: 'bg-violet-50', border: 'border-violet-500', text: 'text-violet-700', accent: '#8b5cf6' },
    { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', accent: '#f59e0b' },
    { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', accent: '#f43f5e' },
    { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', accent: '#6366f1' },
    { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', accent: '#06b6d4' },
    { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', accent: '#f97316' },
  ];
  
  const index = Number(id) % colors.length;
  return colors[index];
}
