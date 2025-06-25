export interface MetricasGenerales {
  totalBoletos: number;
  totalUsuarios: number;
  totalIngresos: number;
  totalUsos: number;
  promedioUsosPorBoleto: number;
  tasaUso: number; // Porcentaje de boletos que han sido usados al menos una vez
}

export interface MetricasPorEstado {
  pendientes: number;
  aprobados: number;
  rechazados: number;
  ingresosPendientes: number;
  ingresosAprobados: number;
  ingresosRechazados: number;
}

export interface MetricasPorLote {
  lote: string;
  cantidadBoletos: number;
  ingresos: number;
  usos: number;
  promedioUsos: number;
}

export interface MetricasPorPeriodo {
  periodo: string; // 'hoy', 'semana', 'mes', 'año'
  boletosCreados: number;
  boletosUsados: number;
  ingresos: number;
  usos: number;
}

export interface MetricasTopUsuarios {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  cantidadBoletos: number;
  totalUsos: number;
  totalGastado: number;
}

export interface MetricasUso {
  boletosSinUso: number;
  boletosConUnUso: number;
  boletosConDosUsos: number;
  boletosConMasUsos: number;
  porcentajeSinUso: number;
  porcentajeConUso: number;
}

export interface MetricasCompletas {
  generales: MetricasGenerales;
  porEstado: MetricasPorEstado;
  porLote: MetricasPorLote[];
  porPeriodo: MetricasPorPeriodo[];
  topUsuarios: MetricasTopUsuarios[];
  uso: MetricasUso;
}
