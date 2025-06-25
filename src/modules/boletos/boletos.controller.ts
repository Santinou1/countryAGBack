import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BoletosService } from './boletos.service';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { DateUtils } from 'src/date-utils';

@Controller('boletos')
@UseGuards(JwtAuthGuard)
export class BoletosController {
  constructor(private readonly boletosService: BoletosService) {}

  @Post('crear/:userId')
  async crearBoleto(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createBoletoDto: CreateBoletoDto,
  ): Promise<Boleto> {
    return this.boletosService.crearBoletoParaLote(userId, createBoletoDto.lote);
  }

  @Get('usuario/:userId')
  async getBoletosByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Boleto[]> {
    return this.boletosService.getBoletosByUser(userId);
  }

  @Post(':boletoId/usar/:userId')
  async usarBoleto(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('boletoId', ParseIntPipe) boletoId: number,
  ): Promise<Boleto> {
    return this.boletosService.usarBoleto(userId, boletoId);
  }

  @Post(':boletoId/estado/:userId')
  async actualizarEstadoBoleto(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('boletoId', ParseIntPipe) boletoId: number,
    @Body('estado') estado: EstadoBoleto,
  ): Promise<Boleto> {
    return this.boletosService.actualizarEstadoBoleto(userId, boletoId, estado);
  }

  @Post(':boletoId/aprobar/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CHOFER)
  async aprobarBoleto(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('boletoId', ParseIntPipe) boletoId: number,
  ): Promise<Boleto> {
    return this.boletosService.aprobarBoleto(userId, boletoId);
  }

  @Post(':boletoId/rechazar/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CHOFER)
  async rechazarBoleto(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('boletoId', ParseIntPipe) boletoId: number,
  ): Promise<Boleto> {
    return this.boletosService.rechazarBoleto(userId, boletoId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllBoletos(): Promise<Boleto[]> {
    return this.boletosService.getAllBoletos();
  }

  @Post('consumir/:codigo')
  async consumirBoletoPorCodigo(@Param('codigo') codigo: string): Promise<Boleto> {
    return this.boletosService.consumirBoletoPorCodigo(codigo);
  }

  @Get('pendientes')
  async getBoletosPendientes(): Promise<Boleto[]> {
    return this.boletosService.getBoletosPendientes();
  }

  @Get('confirmados')
  async getBoletosConfirmados(): Promise<Boleto[]> {
    return this.boletosService.getBoletosConfirmados();
  }

  @Get('consumidos')
  @UseGuards(JwtAuthGuard)
  getBoletosConsumidos() {
    return this.boletosService.getBoletosConsumidos();
  }

  @Post('consumo-manual/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CHOFER)
  async consumoManualAdmin(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<Boleto> {
    if (req.user.rol !== 'chofer') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    return this.boletosService.consumoManualAdmin(id);
  }

  // Nuevos endpoints para el sistema anti-fraude de QR
  @Post(':boletoId/activar-qr')
  async activarQR(@Param('boletoId', ParseIntPipe) boletoId: number): Promise<Boleto> {
    return this.boletosService.activarQR(boletoId);
  }

  @Post(':boletoId/desactivar-qr')
  async desactivarQR(@Param('boletoId', ParseIntPipe) boletoId: number): Promise<Boleto> {
    return this.boletosService.desactivarQR(boletoId);
  }

  @Get(':boletoId/estado-qr')
  async getEstadoQR(
    @Param('boletoId', ParseIntPipe) boletoId: number,
  ): Promise<{ qrActivo: boolean; qrValidoHasta: string | null; esValido: boolean }> {
    return this.boletosService.getEstadoQR(boletoId);
  }

  @Get(':boletoId')
  async getBoletoById(@Param('boletoId', ParseIntPipe) boletoId: number): Promise<Boleto> {
    const boleto = await this.boletosService.getBoletoById(boletoId);
    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }
    return boleto;
  }

  // Endpoint para verificar timezone
  @Get('timezone/info')
  async getTimezoneInfo() {
    return {
      timezone: DateUtils.getTimezone(),
      currentTime: DateUtils.now(),
      currentTimeISO: DateUtils.nowISO(),
      formattedTime: DateUtils.formatArgentina(DateUtils.now()),
    };
  }
}
