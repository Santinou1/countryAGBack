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

    private generarCodigoUnico(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    private async esCodigoUnico(codigo: string, tipo: 'ida' | 'vuelta'): Promise<boolean> {
        const boletoExistente = await this.boletosRepository.findOne({
            where: tipo === 'ida' ? { codigoIda: codigo } : { codigoVuelta: codigo }
        });
        return !boletoExistente;
    }

    private async generarCodigoValido(tipo: 'ida' | 'vuelta'): Promise<string> {
        let codigo: string;
        let esUnico = false;
        
        do {
            codigo = this.generarCodigoUnico();
            esUnico = await this.esCodigoUnico(codigo, tipo);
        } while (!esUnico);

        return codigo;
    }

    async crearBoletoParaLote(userId: number, lote: string): Promise<Boleto> {
        // Verificar que el usuario existe
        await this.usersService.findOne(userId);

        // Generar códigos únicos para ida y vuelta
        const codigoIda = await this.generarCodigoValido('ida');
        const codigoVuelta = await this.generarCodigoValido('vuelta');

        // Crear nuevo boleto
        const nuevoBoleto = this.boletosRepository.create({
            idUsers: userId,
            lote: lote,
            codigoBoleto: uuidv4(),
            codigoIda,
            codigoVuelta,
            estado: EstadoBoleto.PENDIENTE,
            ida: false,
            vuelta: false
        });

        this.logger.log(
            `Creando nuevo boleto para usuario ${userId} en lote ${lote} con códigos ida: ${codigoIda}, vuelta: ${codigoVuelta}`,
            'BoletosService'
        );
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

        // Si el usuario es el admin (ID 1), permitir todas las operaciones
        if (userId === 1) {
            return boleto;
        }

        // Para otros usuarios, verificar que sean propietarios
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

    async consumirIdaPorCodigo(codigo: string): Promise<Boleto> {
        const boleto = await this.boletosRepository.findOne({
            where: { codigoIda: codigo }
        });

        if (!boleto) {
            throw new NotFoundException('Boleto no encontrado');
        }

        if (boleto.ida) {
            throw new BadRequestException('El boleto ya está marcado como ida');
        }

        if (boleto.estado !== EstadoBoleto.APROBADO) {
            throw new BadRequestException('El boleto no está aprobado');
        }

        boleto.ida = true;
        this.logger.log(`Consumiendo ida del boleto con código ${codigo}`, 'BoletosService');
        return this.boletosRepository.save(boleto);
    }

    async consumirVueltaPorCodigo(codigo: string): Promise<Boleto> {
        const boleto = await this.boletosRepository.findOne({
            where: { codigoVuelta: codigo }
        });

        if (!boleto) {
            throw new NotFoundException('Boleto no encontrado');
        }

        if (boleto.vuelta) {
            throw new BadRequestException('El boleto ya está marcado como vuelta');
        }

        if (boleto.estado !== EstadoBoleto.APROBADO) {
            throw new BadRequestException('El boleto no está aprobado');
        }

        if (!boleto.ida) {
            throw new BadRequestException('El boleto debe estar marcado como ida antes de marcar la vuelta');
        }

        boleto.vuelta = true;
        this.logger.log(`Consumiendo vuelta del boleto con código ${codigo}`, 'BoletosService');
        return this.boletosRepository.save(boleto);
    }

    async getBoletosPendientes(): Promise<Boleto[]> {
        this.logger.log('Obteniendo boletos pendientes', 'BoletosService');
        return this.boletosRepository.find({
            where: { estado: EstadoBoleto.PENDIENTE },
            relations: ['usuario'],
            order: {
                id: 'DESC'
            }
        });
    }

    async getBoletosConfirmados(): Promise<Boleto[]> {
        this.logger.log('Obteniendo boletos confirmados (aprobados y no completamente consumidos)', 'BoletosService');
        return this.boletosRepository.find({
            where: [
                {
                    estado: EstadoBoleto.APROBADO,
                    ida: false,
                    vuelta: false
                },
                {
                    estado: EstadoBoleto.APROBADO,
                    ida: true,
                    vuelta: false
                },
                {
                    estado: EstadoBoleto.APROBADO,
                    ida: false,
                    vuelta: true
                }
            ],
            relations: ['usuario'],
            order: {
                id: 'DESC'
            }
        });
    }

    async getBoletosConsumidos(): Promise<Boleto[]> {
        this.logger.log('Obteniendo boletos completamente consumidos (ida y vuelta)', 'BoletosService');
        return this.boletosRepository.find({
            where: {
                ida: true,
                vuelta: true
            },
            relations: ['usuario'],
            order: {
                id: 'DESC'
            }
        });
    }

    async getBoletoById(boletoId: number): Promise<Boleto | null> {
        this.logger.log(`Obteniendo boleto ${boletoId}`, 'BoletosService');
        return this.boletosRepository.findOne({
            where: { id: boletoId },
            relations: ['usuario']
        });
    }
} 