import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Boleto, EstadoBoleto } from '../boletos/entities/boleto.entity';
import { User } from '../users/entities/user.entity';
import { LoggingService } from '../../logging/logging.service';
import {
  MetricasGenerales,
  MetricasPorEstado,
  MetricasPorLote,
  MetricasPorPeriodo,
  MetricasTopUsuarios,
  MetricasUso,
  MetricasCompletas,
} from './dto/metricas.dto';

@Injectable()
export class MetricasService {
  private readonly PRECIO_BOLETO = 7000;

  constructor(
    @InjectRepository(Boleto)
    private boletosRepository: Repository<Boleto>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggingService,
  ) {}

  async obtenerMetricasCompletas(): Promise<MetricasCompletas> {
    this.logger.log('Obteniendo métricas completas', 'MetricasService');

    const [generales, porEstado, porLote, porPeriodo, topUsuarios, uso] = await Promise.all([
      this.obtenerMetricasGenerales(),
      this.obtenerMetricasPorEstado(),
      this.obtenerMetricasPorLote(),
      this.obtenerMetricasPorPeriodo(),
      this.obtenerTopUsuarios(),
      this.obtenerMetricasUso(),
    ]);

    return {
      generales,
      porEstado,
      porLote,
      porPeriodo,
      topUsuarios,
      uso,
    };
  }

  async obtenerMetricasGenerales(): Promise<MetricasGenerales> {
    const [totalBoletos, totalUsuarios, totalUsos, boletosAprobados] = await Promise.all([
      this.boletosRepository.count(),
      this.usersRepository.count(),
      this.boletosRepository
        .createQueryBuilder('boleto')
        .select('SUM(boleto.contador)', 'total')
        .getRawOne(),
      this.boletosRepository.count({ where: { estado: EstadoBoleto.APROBADO } }),
    ]);

    const totalIngresos = boletosAprobados * this.PRECIO_BOLETO;
    const promedioUsosPorBoleto = totalBoletos > 0 ? (totalUsos?.total || 0) / totalBoletos : 0;

    // Calcular tasa de uso (boletos que han sido usados al menos una vez)
    const boletosUsados = await this.boletosRepository.count({
      where: { contador: MoreThanOrEqual(1) },
    });
    const tasaUso = totalBoletos > 0 ? (boletosUsados / totalBoletos) * 100 : 0;

    return {
      totalBoletos,
      totalUsuarios,
      totalIngresos,
      totalUsos: totalUsos?.total || 0,
      promedioUsosPorBoleto: Math.round(promedioUsosPorBoleto * 100) / 100,
      tasaUso: Math.round(tasaUso * 100) / 100,
    };
  }

  async obtenerMetricasPorEstado(): Promise<MetricasPorEstado> {
    const [pendientes, aprobados, rechazados] = await Promise.all([
      this.boletosRepository.count({ where: { estado: EstadoBoleto.PENDIENTE } }),
      this.boletosRepository.count({ where: { estado: EstadoBoleto.APROBADO } }),
      this.boletosRepository.count({ where: { estado: EstadoBoleto.RECHAZADO } }),
    ]);

    return {
      pendientes,
      aprobados,
      rechazados,
      ingresosPendientes: pendientes * this.PRECIO_BOLETO,
      ingresosAprobados: aprobados * this.PRECIO_BOLETO,
      ingresosRechazados: rechazados * this.PRECIO_BOLETO,
    };
  }

  async obtenerMetricasPorLote(): Promise<MetricasPorLote[]> {
    const resultados = await this.boletosRepository
      .createQueryBuilder('boleto')
      .select('boleto.lote', 'lote')
      .addSelect('COUNT(boleto.id)', 'cantidadBoletos')
      .addSelect('SUM(boleto.contador)', 'usos')
      .addSelect(
        'SUM(CASE WHEN boleto.estado = :estadoAprobado THEN 1 ELSE 0 END)',
        'boletosAprobados',
      )
      .setParameter('estadoAprobado', EstadoBoleto.APROBADO)
      .groupBy('boleto.lote')
      .orderBy('cantidadBoletos', 'DESC')
      .getRawMany();

    return resultados.map(result => ({
      lote: result.lote,
      cantidadBoletos: parseInt(result.cantidadBoletos),
      ingresos: parseInt(result.boletosAprobados) * this.PRECIO_BOLETO,
      usos: parseInt(result.usos) || 0,
      promedioUsos:
        parseInt(result.cantidadBoletos) > 0
          ? Math.round(((parseInt(result.usos) || 0) / parseInt(result.cantidadBoletos)) * 100) /
            100
          : 0,
    }));
  }

  async obtenerMetricasPorPeriodo(): Promise<MetricasPorPeriodo[]> {
    const ahora = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicioSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioAno = new Date(ahora.getFullYear(), 0, 1);

    const [hoy, semana, mes, ano] = await Promise.all([
      this.obtenerMetricasParaPeriodo(inicioDia, ahora, 'hoy'),
      this.obtenerMetricasParaPeriodo(inicioSemana, ahora, 'semana'),
      this.obtenerMetricasParaPeriodo(inicioMes, ahora, 'mes'),
      this.obtenerMetricasParaPeriodo(inicioAno, ahora, 'año'),
    ]);

    return [hoy, semana, mes, ano];
  }

  private async obtenerMetricasParaPeriodo(
    fechaInicio: Date,
    fechaFin: Date,
    periodo: string,
  ): Promise<MetricasPorPeriodo> {
    const [boletosCreados, boletosUsados, usos, boletosAprobados] = await Promise.all([
      this.boletosRepository.count({
        where: {
          createdAt: Between(fechaInicio, fechaFin),
        },
      }),
      this.boletosRepository.count({
        where: {
          primerUso: Between(fechaInicio, fechaFin),
        },
      }),
      this.boletosRepository
        .createQueryBuilder('boleto')
        .select('SUM(boleto.contador)', 'total')
        .where('boleto.primerUso BETWEEN :fechaInicio AND :fechaFin', {
          fechaInicio,
          fechaFin,
        })
        .getRawOne(),
      this.boletosRepository.count({
        where: {
          createdAt: Between(fechaInicio, fechaFin),
          estado: EstadoBoleto.APROBADO,
        },
      }),
    ]);

    return {
      periodo,
      boletosCreados,
      boletosUsados,
      ingresos: boletosAprobados * this.PRECIO_BOLETO,
      usos: parseInt(usos?.total) || 0,
    };
  }

  async obtenerTopUsuarios(): Promise<MetricasTopUsuarios[]> {
    const resultados = await this.boletosRepository
      .createQueryBuilder('boleto')
      .leftJoinAndSelect('boleto.usuario', 'usuario')
      .select('usuario.id', 'usuarioId')
      .addSelect('usuario.nombre', 'nombre')
      .addSelect('usuario.apellido', 'apellido')
      .addSelect('usuario.email', 'email')
      .addSelect('COUNT(boleto.id)', 'cantidadBoletos')
      .addSelect('SUM(boleto.contador)', 'totalUsos')
      .addSelect(
        'SUM(CASE WHEN boleto.estado = :estadoAprobado THEN 1 ELSE 0 END)',
        'boletosAprobados',
      )
      .setParameter('estadoAprobado', EstadoBoleto.APROBADO)
      .groupBy('usuario.id')
      .addGroupBy('usuario.nombre')
      .addGroupBy('usuario.apellido')
      .addGroupBy('usuario.email')
      .orderBy('cantidadBoletos', 'DESC')
      .limit(10)
      .getRawMany();

    return resultados.map(result => ({
      usuarioId: parseInt(result.usuarioId),
      nombre: result.nombre || 'Sin nombre',
      apellido: result.apellido || 'Sin apellido',
      email: result.email,
      cantidadBoletos: parseInt(result.cantidadBoletos),
      totalUsos: parseInt(result.totalUsos) || 0,
      totalGastado: parseInt(result.boletosAprobados) * this.PRECIO_BOLETO,
    }));
  }

  async obtenerMetricasUso(): Promise<MetricasUso> {
    const [sinUso, conUnUso, conDosUsos, conMasUsos] = await Promise.all([
      this.boletosRepository.count({ where: { contador: 0 } }),
      this.boletosRepository.count({ where: { contador: 1 } }),
      this.boletosRepository.count({ where: { contador: 2 } }),
      this.boletosRepository.count({ where: { contador: MoreThanOrEqual(3) } }),
    ]);

    const totalBoletos = sinUso + conUnUso + conDosUsos + conMasUsos;
    const porcentajeSinUso = totalBoletos > 0 ? (sinUso / totalBoletos) * 100 : 0;
    const porcentajeConUso = totalBoletos > 0 ? ((totalBoletos - sinUso) / totalBoletos) * 100 : 0;

    return {
      boletosSinUso: sinUso,
      boletosConUnUso: conUnUso,
      boletosConDosUsos: conDosUsos,
      boletosConMasUsos: conMasUsos,
      porcentajeSinUso: Math.round(porcentajeSinUso * 100) / 100,
      porcentajeConUso: Math.round(porcentajeConUso * 100) / 100,
    };
  }

  async obtenerMetricasResumidas() {
    const generales = await this.obtenerMetricasGenerales();
    const porEstado = await this.obtenerMetricasPorEstado();
    const uso = await this.obtenerMetricasUso();

    return {
      generales,
      porEstado,
      uso,
    };
  }
}
