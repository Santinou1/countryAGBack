import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BoletosService } from './boletos.service';
import { Boleto } from './entities/boleto.entity';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('boletos')
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

    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllBoletos(): Promise<Boleto[]> {
        return this.boletosService.getAllBoletos();
    }
} 