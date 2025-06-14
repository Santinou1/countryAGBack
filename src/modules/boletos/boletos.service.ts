import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { LoggingService } from '../../logging/logging.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BoletosService {
    constructor(
        @InjectRepository(Boleto)
        private boletosRepository: Repository<Boleto>,
        private readonly logger: LoggingService,
        private readonly usersService: UsersService
    ) {}

    async crearBoletoParaLote(userId: number, lote: string): Promise<Boleto> {
        // Verificar que el usuario existe
        await this.usersService.findOne(userId);

        // Crear nuevo boleto
        const nuevoBoleto = this.boletosRepository.create({
            idUsers: userId,
            lote: lote,
            codigoBoleto: uuidv4(),
            estado: EstadoBoleto.PENDIENTE,
            ida: false,
            vuelta: false
        });

        this.logger.log(`Creando nuevo boleto para usuario ${userId} en lote ${lote}`, 'BoletosService');
        return this.boletosRepository.save(nuevoBoleto);
    }

    async getBoletosByUser(userId: number): Promise<Boleto[]> {
        this.logger.log(`Obteniendo boletos del usuario ${userId}`, 'BoletosService');
        return this.boletosRepository.find({
            where: { idUsers: userId },
            relations: ['usuario']
        });
    }

    async marcarIda(userId: number, boletoId: number): Promise<Boleto> {
        const boleto = await this.verificarPropietarioBoleto(userId, boletoId);
        
        if (boleto.ida) {
            throw new BadRequestException('El boleto ya está marcado como ida');
        }

        boleto.ida = true;
        this.logger.log(`Marcando boleto ${boletoId} como ida para usuario ${userId}`, 'BoletosService');
        return this.boletosRepository.save(boleto);
    }

    async marcarVuelta(userId: number, boletoId: number): Promise<Boleto> {
        const boleto = await this.verificarPropietarioBoleto(userId, boletoId);
        
        if (boleto.vuelta) {
            throw new BadRequestException('El boleto ya está marcado como vuelta');
        }

        boleto.vuelta = true;
        this.logger.log(`Marcando boleto ${boletoId} como vuelta para usuario ${userId}`, 'BoletosService');
        return this.boletosRepository.save(boleto);
    }

    private async verificarPropietarioBoleto(userId: number, boletoId: number): Promise<Boleto> {
        const boleto = await this.boletosRepository.findOne({
            where: { id: boletoId }
        });

        if (!boleto) {
            this.logger.error(`Boleto ${boletoId} no encontrado`, undefined, 'BoletosService');
            throw new NotFoundException(`Boleto no encontrado`);
        }

        if (boleto.idUsers !== userId) {
            this.logger.error(`Usuario ${userId} no es propietario del boleto ${boletoId}`, undefined, 'BoletosService');
            throw new BadRequestException('No tienes permiso para modificar este boleto');
        }

        return boleto;
    }

    async getAllBoletos(): Promise<Boleto[]> {
        this.logger.log('Obteniendo todos los boletos con información de usuarios', 'BoletosService');
        return this.boletosRepository.find({
            relations: ['usuario'],
            order: {
                id: 'DESC' // Ordenar por ID, más recientes primero (asumiendo que IDs más altos son más recientes)
            }
        });
    }

    async actualizarEstadoBoleto(userId: number, boletoId: number, nuevoEstado: EstadoBoleto): Promise<Boleto> {
        const boleto = await this.verificarPropietarioBoleto(userId, boletoId);
        
        boleto.estado = nuevoEstado;
        this.logger.log(`Actualizando estado del boleto ${boletoId} a ${nuevoEstado} para usuario ${userId}`, 'BoletosService');
        return this.boletosRepository.save(boleto);
    }

    async aprobarBoleto(userId: number, boletoId: number): Promise<Boleto> {
        return this.actualizarEstadoBoleto(userId, boletoId, EstadoBoleto.APROBADO);
    }

    async rechazarBoleto(userId: number, boletoId: number): Promise<Boleto> {
        return this.actualizarEstadoBoleto(userId, boletoId, EstadoBoleto.RECHAZADO);
    }
} 