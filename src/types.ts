export interface Curso {
  id: number;
  nombre: string;
  carrera_id: number;
}

export interface Profesor {
  id: number;
  nombre: string;
}

export interface Asignatura {
  id: number;
  nombre: string;
}

export interface Sala {
  id: number;
  nombre: string;
}

export interface BloqueHorario {
  id: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface Horario {
  id: number;
  curso_id: number;
  asignatura_id: number;
  profesor_id: number;
  sala_id: number;
  dia_semana: string;
  bloque_id: number;
  curso_nombre?: string;
  asignatura_nombre?: string;
  profesor_nombre?: string;
  sala_nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
}
