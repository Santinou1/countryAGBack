import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { MetricasService } from './metricas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';

@Controller('metricas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get()
  async obtenerMetricasCompletas(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasCompletas();
  }

  @Get('generales')
  async obtenerMetricasGenerales(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasGenerales();
  }

  @Get('estado')
  async obtenerMetricasPorEstado(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasPorEstado();
  }

  @Get('lotes')
  async obtenerMetricasPorLote(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasPorLote();
  }

  @Get('periodo')
  async obtenerMetricasPorPeriodo(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasPorPeriodo();
  }

  @Get('top-usuarios')
  async obtenerTopUsuarios(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerTopUsuarios();
  }

  @Get('uso')
  async obtenerMetricasUso(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasUso();
  }

  @Get('resumen')
  async obtenerMetricasResumidas(@Req() req) {
    if (req.user.rol !== 'admin') {
      throw new ForbiddenException('Solo los administradores pueden acceder a las métricas.');
    }
    return this.metricasService.obtenerMetricasResumidas();
  }
}
