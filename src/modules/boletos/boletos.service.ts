import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { LoggingService } from '../../logging/logging.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { DateUtils } from 'src/date-utils';

@Injectable()
export class BoletosService {
  constructor(
    @InjectRepository(Boleto)
    private boletosRepository: Repository<Boleto>,
    private readonly logger: LoggingService,
    private readonly usersService: UsersService,
  ) {}

  private generarCodigoUnico(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async esCodigoUnico(codigo: string): Promise<boolean> {
    const boletoExistente = await this.boletosRepository.findOne({
      where: { codigoBoleto: codigo },
    });
    return !boletoExistente;
  }

  private async generarCodigoValido(): Promise<string> {
    let codigo: string;
    let esUnico = false;

    do {
      codigo = this.generarCodigoUnico();
      esUnico = await this.esCodigoUnico(codigo);
    } while (!esUnico);

    return codigo;
  }

  async crearBoletoParaLote(userId: number, lote: string): Promise<Boleto> {
    // Verificar que el usuario existe
    await this.usersService.findOne(userId);

    // Generar código único para el boleto
    const codigoBoleto = await this.generarCodigoValido();

    // Crear nuevo boleto
    const nuevoBoleto = this.boletosRepository.create({
      idUsers: userId,
      lote: lote,
      codigoBoleto: codigoBoleto,
      estado: EstadoBoleto.PENDIENTE,
      contador: 0,
      activo: true,
      qrActivo: false,
    });

    this.logger.log(
      `Creando nuevo boleto para usuario ${userId} en lote ${lote} con código: ${codigoBoleto}`,
      'BoletosService',
    );
    return this.boletosRepository.save(nuevoBoleto);
  }

  async getBoletosByUser(userId: number): Promise<Boleto[]> {
    this.logger.log(`Obteniendo boletos del usuario ${userId}`, 'BoletosService');
    return this.boletosRepository.find({
      where: { idUsers: userId },
      relations: ['usuario'],
    });
  }

  async usarBoleto(userId: number, boletoId: number): Promise<Boleto> {
    const boleto = await this.verificarPropietarioBoleto(userId, boletoId);

    if (!boleto.isValido()) {
      throw new BadRequestException('El boleto no está válido');
    }

    // Si es el primer uso, registrar el primer uso
    if (!boleto.primerUso) {
      boleto.registrarPrimerUso();
    }

    // Incrementar contador
    boleto.incrementarContador();

    this.logger.log(
      `Usando boleto ${boletoId} para usuario ${userId}. Contador: ${boleto.contador}`,
      'BoletosService',
    );
    return this.boletosRepository.save(boleto);
  }

  private async verificarPropietarioBoleto(userId: number, boletoId: number): Promise<Boleto> {
    const boleto = await this.boletosRepository.findOne({
      where: { id: boletoId },
    });

    if (!boleto) {
      this.logger.error(`Boleto ${boletoId} no encontrado`, undefined, 'BoletosService');
      throw new NotFoundException(`Boleto no encontrado`);
    }

    this.logger.log(
      `Verificando permisos: userId=${userId}, boletoId=${boletoId}, boletoOwner=${boleto.idUsers}`,
      'BoletosService',
    );

    // Verificar si el usuario es admin o chofer
    const usuario = await this.usersService.findOne(userId);
    if (usuario && (usuario.rol === 'admin' || usuario.rol === 'chofer')) {
      this.logger.log(`Usuario ${userId} es ${usuario.rol}, permitiendo operación`, 'BoletosService');
      return boleto;
    }

    // Para otros usuarios, verificar que sean propietarios
    if (boleto.idUsers !== userId) {
      this.logger.error(
        `Usuario ${userId} no es propietario del boleto ${boletoId}`,
        undefined,
        'BoletosService',
      );
      throw new BadRequestException('No tienes permiso para modificar este boleto');
    }

    this.logger.log(`Usuario ${userId} es propietario del boleto ${boletoId}`, 'BoletosService');
    return boleto;
  }

  async getAllBoletos(): Promise<Boleto[]> {
    this.logger.log('Obteniendo todos los boletos con información de usuarios', 'BoletosService');
    return this.boletosRepository.find({
      relations: ['usuario'],
      order: {
        id: 'DESC', // Ordenar por ID, más recientes primero
      },
    });
  }

  async actualizarEstadoBoleto(
    userId: number,
    boletoId: number,
    nuevoEstado: EstadoBoleto,
  ): Promise<Boleto> {
    const boleto = await this.verificarPropietarioBoleto(userId, boletoId);

    boleto.estado = nuevoEstado;
    this.logger.log(
      `Actualizando estado del boleto ${boletoId} a ${nuevoEstado} para usuario ${userId}`,
      'BoletosService',
    );
    return this.boletosRepository.save(boleto);
  }

  async aprobarBoleto(userId: number, boletoId: number): Promise<Boleto> {
    return this.actualizarEstadoBoleto(userId, boletoId, EstadoBoleto.APROBADO);
  }

  async rechazarBoleto(userId: number, boletoId: number): Promise<Boleto> {
    return this.actualizarEstadoBoleto(userId, boletoId, EstadoBoleto.RECHAZADO);
  }

  async consumirBoletoPorCodigo(codigo: string): Promise<Boleto> {
    const boleto = await this.boletosRepository.findOne({
      where: { codigoBoleto: codigo },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    if (boleto.estado !== EstadoBoleto.APROBADO) {
      throw new BadRequestException('El boleto no está aprobado');
    }

    if (!boleto.isValido()) {
      throw new BadRequestException('El boleto no está válido');
    }

    // Verificar que el QR esté activo y válido
    if (!boleto.isQRValido()) {
      throw new BadRequestException('El QR del boleto no está activo o ha expirado');
    }

    // Si es el primer uso, registrar el primer uso
    if (!boleto.primerUso) {
      boleto.registrarPrimerUso();
    }

    // Incrementar contador
    boleto.incrementarContador();

    this.logger.log(
      `Consumiendo boleto con código ${codigo}. Contador: ${boleto.contador}`,
      'BoletosService',
    );
    return this.boletosRepository.save(boleto);
  }

  async getBoletosPendientes(): Promise<Boleto[]> {
    this.logger.log('Obteniendo boletos pendientes', 'BoletosService');
    return this.boletosRepository.find({
      where: { estado: EstadoBoleto.PENDIENTE },
      relations: ['usuario'],
      order: { id: 'DESC' },
    });
  }

  async getBoletosConfirmados(): Promise<Boleto[]> {
    this.logger.log('Obteniendo boletos confirmados', 'BoletosService');
    return this.boletosRepository.find({
      where: { estado: EstadoBoleto.APROBADO },
      relations: ['usuario'],
      order: { id: 'DESC' },
    });
  }

  async getBoletosConsumidos(): Promise<Boleto[]> {
    this.logger.log('Obteniendo boletos consumidos', 'BoletosService');
    return this.boletosRepository.find({
      where: {
        estado: EstadoBoleto.APROBADO,
        primerUso: Not(IsNull()), // Boletos que ya han sido usados
      },
      relations: ['usuario'],
      order: { id: 'DESC' },
    });
  }

  async getBoletoById(boletoId: number): Promise<Boleto | null> {
    return this.boletosRepository.findOne({
      where: { id: boletoId },
      relations: ['usuario'],
    });
  }

  // Método público para guardar boletos (usado por otros servicios)
  async save(boleto: Boleto): Promise<Boleto> {
    return this.boletosRepository.save(boleto);
  }

  // Nuevos métodos para el sistema anti-fraude de QR
  async activarQR(boletoId: number): Promise<Boleto> {
    const boleto = await this.boletosRepository.findOne({
      where: { id: boletoId },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    if (boleto.estado !== EstadoBoleto.APROBADO) {
      throw new BadRequestException('El boleto no está aprobado');
    }

    if (!boleto.isValido()) {
      throw new BadRequestException('El boleto no está válido');
    }

    boleto.activarQR();
    this.logger.log(`Activando QR para boleto ${boletoId}`, 'BoletosService');
    return this.boletosRepository.save(boleto);
  }

  async desactivarQR(boletoId: number): Promise<Boleto> {
    const boleto = await this.boletosRepository.findOne({
      where: { id: boletoId },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    boleto.desactivarQR();
    this.logger.log(`Desactivando QR para boleto ${boletoId}`, 'BoletosService');
    return this.boletosRepository.save(boleto);
  }

  async getEstadoQR(
    boletoId: number,
  ): Promise<{ qrActivo: boolean; qrValidoHasta: string | null; esValido: boolean }> {
    const boleto = await this.boletosRepository.findOne({
      where: { id: boletoId },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    return {
      qrActivo: boleto.qrActivo,
      qrValidoHasta: boleto.qrValidoHasta ? DateUtils.formatExpiration(boleto.qrValidoHasta) : null,
      esValido: boleto.isQRValido(),
    };
  }

  async consumoManualAdmin(boletoId: number): Promise<Boleto> {
    const boleto = await this.boletosRepository.findOne({
      where: { id: boletoId },
    });

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    if (boleto.estado !== EstadoBoleto.APROBADO) {
      throw new BadRequestException('El boleto no está aprobado y no puede ser consumido.');
    }

    // Comprobar si el boleto es válido (no ha expirado)
    if (boleto.primerUso && !boleto.isValido()) {
      throw new BadRequestException('El boleto está expirado y no puede ser consumido.');
    }
    
    // Si es el primer uso, se registra para iniciar la validez
    if (!boleto.primerUso) {
      boleto.registrarPrimerUso();
    }

    boleto.incrementarContador();
    this.logger.log(
      `Consumo manual por admin para boleto ${boletoId}. Nuevo contador: ${boleto.contador}`,
      'BoletosService',
    );
    return this.boletosRepository.save(boleto);
  }
}
