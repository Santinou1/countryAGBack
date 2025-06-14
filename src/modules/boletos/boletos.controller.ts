import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BoletosService } from './boletos.service';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('boletos')
@UseGuards(JwtAuthGuard)
export class BoletosController {
    constructor(private readonly boletosService: BoletosService) {}

    @Post('crear/:userId')
    async crearBoleto(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() createBoletoDto: CreateBoletoDto
    ): Promise<Boleto> {
        return this.boletosService.crearBoletoParaLote(userId, createBoletoDto.lote);
    }

    @Get('usuario/:userId')
    async getBoletosByUser(
        @Param('userId', ParseIntPipe) userId: number
    ): Promise<Boleto[]> {
        return this.boletosService.getBoletosByUser(userId);
    }

    @Post(':boletoId/marcar-ida/:userId')
    async marcarIda(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('boletoId', ParseIntPipe) boletoId: number
    ): Promise<Boleto> {
        return this.boletosService.marcarIda(userId, boletoId);
    }

    @Post(':boletoId/marcar-vuelta/:userId')
    async marcarVuelta(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('boletoId', ParseIntPipe) boletoId: number
    ): Promise<Boleto> {
        return this.boletosService.marcarVuelta(userId, boletoId);
    }

    @Post(':boletoId/estado/:userId')
    async actualizarEstadoBoleto(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('boletoId', ParseIntPipe) boletoId: number,
        @Body('estado') estado: EstadoBoleto
    ): Promise<Boleto> {
        return this.boletosService.actualizarEstadoBoleto(userId, boletoId, estado);
    }

    @Post(':boletoId/aprobar/:userId')
    async aprobarBoleto(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('boletoId', ParseIntPipe) boletoId: number
    ): Promise<Boleto> {
        return this.boletosService.aprobarBoleto(userId, boletoId);
    }

    @Post(':boletoId/rechazar/:userId')
    async rechazarBoleto(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('boletoId', ParseIntPipe) boletoId: number
    ): Promise<Boleto> {
        return this.boletosService.rechazarBoleto(userId, boletoId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllBoletos(): Promise<Boleto[]> {
        return this.boletosService.getAllBoletos();
    }
} 